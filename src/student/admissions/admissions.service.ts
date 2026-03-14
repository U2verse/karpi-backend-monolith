import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionLink, AdmissionStatus } from '../../shared/entities/admission-link.entity';
import { SubmitAdmissionDto } from './dto/submit-admission.dto';
import { CreateAdmissionLinkDto } from './dto/create-admission-link.dto';
import { randomBytes } from 'crypto';
import { StudentsService } from '../students/students.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { getEmailTransporter } from '../../superadmin/enrollments/email';
import { STUDENT_APP_BASE_URL } from '../../shared/config/app-urls';

@Injectable()
export class AdmissionsService {
  constructor(
    @InjectRepository(AdmissionLink)
    private readonly linkRepo: Repository<AdmissionLink>,

    @Inject(forwardRef(() => StudentsService))
    private readonly studentsService: StudentsService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly dataSource: DataSource,
  ) {}

  // ----------------------------------
  // ADMIN: Generate admission link
  // ----------------------------------
  
  async generateAdmissionLink(
    user: any,
    dto: CreateAdmissionLinkDto,
  ) {
    //console.log('Generating admission link with DTO:', dto);
    // 🔐 If called by admin (JWT enabled)
    const tenant_id = user?.tenant_id ?? 'DEV_TENANT';
    const created_by = user?.user_id ?? null;

    // 🔒 Prevent duplicate pending admission link
    const now = new Date();

    const existing = await this.linkRepo.findOne({
      where: {
        tenant_id,
        student_email: dto.student_email.toLowerCase(),
        course_id: dto.course_id ?? undefined,
        status: AdmissionStatus.PENDING,
      },
      order: { created_at: 'DESC' },
    });

    if (existing) {
      if (existing.expires_at > now) {
        throw new BadRequestException(
          'An active admission link already exists. Please wait until it expires.',
        );
      }

      existing.status = AdmissionStatus.EXPIRED;
      await this.linkRepo.save(existing);
    }

    // 🔐 Generate secure token
    const token = randomBytes(32).toString('hex');

    // ⏰ Default expires_at: 48 hours from now if not provided
    const expiresAt = dto.expires_at
      ? new Date(dto.expires_at)
      : new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 📝 Create admission link record
    const link = this.linkRepo.create({
      tenant_id,
      created_by,
      student_email: dto.student_email.toLowerCase(),
      student_name: dto.student_name ?? null,
      course_id: dto.course_id ?? null,
      course_name: dto.course_name,
      amount: dto.amount ?? null,
      token,
      expires_at: expiresAt,
      status: AdmissionStatus.PENDING,
    } as Partial<AdmissionLink>);

    // 💾 Save admission link
    const savedLink = await this.linkRepo.save(link);

    // 🔗 Build admission URL
    const admissionUrl = `${STUDENT_APP_BASE_URL}/admission/${token}`;

    // 📧 Send admission email (non-blocking & safe)
    try {
      const templatePath = path.resolve(
        process.cwd(),
        'src',
        'superadmin',
        'email-templates',
        'admission-email.html',
      );

      let html = fs.readFileSync(templatePath, 'utf-8');
      html = html
        .replace(/{{STUDENT_NAME}}/g, savedLink.student_name ?? 'Student')
        .replace(/{{COURSE_NAME}}/g, savedLink.course_name ?? '')
        .replace(/{{ADMISSION_LINK}}/g, admissionUrl)
        .replace(
          /{{EXPIRES_AT}}/g,
          savedLink.expires_at.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        )
        .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

      const transporter = getEmailTransporter();
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: savedLink.student_email,
        subject: `You're invited to enroll in ${savedLink.course_name ?? 'a course'}`,
        html,
      });
    } catch (error) {
      // ❗ Do NOT fail admission link creation if email fails
      console.error(
        'Admission email sending failed:',
        error?.message || error,
      );
    }

    return savedLink;
  }

  // ----------------------------------
  // PUBLIC: Get link by token
  // ----------------------------------
  // Private: returns raw entity — used internally by submitAdmission
  private async findLinkEntity(tokenOrId: string): Promise<AdmissionLink> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      await qr.query(`SELECT set_config('my.role', 'SUPERADMIN', false)`);

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenOrId);
      const link = await qr.manager.findOne(AdmissionLink, {
        where: isUUID ? { id: tokenOrId } : { token: tokenOrId },
      });

      if (!link) throw new NotFoundException('Invalid admission link');
      if (link.status !== AdmissionStatus.PENDING) throw new BadRequestException('Admission link already used');

      if (new Date() > link.expires_at) {
        link.status = AdmissionStatus.EXPIRED;
        await qr.manager.save(link);
        throw new BadRequestException('Admission link expired');
      }

      return link;
    } finally {
      await qr.release();
    }
  }

  // Public: returns link + academy_domain for the frontend form
  async getLinkByToken(tokenOrId: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      await qr.query(`SELECT set_config('my.role', 'SUPERADMIN', false)`);

      const link = await this.findLinkEntity(tokenOrId);

      // Resolve the academy domain so the frontend can redirect after login
      const domainRows = await qr.query(
        `SELECT d.domain FROM domains d
         JOIN clients c ON c.client_id = d.client_id
         WHERE c.tenant_id = $1 AND d.type = 'subdomain' AND d.status = 'active'
         LIMIT 1`,
        [link.tenant_id],
      );
      const academy_domain: string | null = domainRows?.[0]?.domain ?? null;

      return { ...link, academy_domain };
    } finally {
      await qr.release();
    }
  }


  // ----------------------------------
  // PUBLIC: Submit admission
  // ----------------------------------
  
  async submitAdmission(token: string, dto: SubmitAdmissionDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set SUPERADMIN role so RLS allows reading the admission link
      await queryRunner.query(`SELECT set_config('my.role', 'SUPERADMIN', false)`);

      // 1️⃣ Validate admission link — load via the SAME queryRunner to avoid
      //    QueryRunnerAlreadyReleasedError (findLinkEntity creates & releases its
      //    own runner, leaving the entity associated with a dead runner).
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      const link = await queryRunner.manager.findOne(AdmissionLink, {
        where: isUUID ? { id: token } : { token },
      });

      if (!link) throw new NotFoundException('Invalid admission link');
      if (link.status !== AdmissionStatus.PENDING)
        throw new BadRequestException('Admission link already used');
      if (new Date() > link.expires_at) {
        link.status = AdmissionStatus.EXPIRED;
        await queryRunner.manager.save(link);
        throw new BadRequestException('Admission link expired');
      }

      const studentName =
        dto.student_name?.trim() || link.student_name?.trim();

      if (!studentName) {
        throw new BadRequestException('Student name is required');
      }

      if (link.course_id === undefined || link.course_id === null) {
        throw new BadRequestException('Course is missing in admission link');
      }

      // 2️⃣ Create / reuse student (USING TRANSACTION)
      const student = await this.studentsService.createFromAdmission(
        {
          tenant_id: link.tenant_id,
          email: link.student_email,
          name: studentName,
          phone: dto.phone,
          password: dto.password,
        },
        queryRunner.manager,
      );

      // 3️⃣ Create enrollment (USING TRANSACTION)
      await this.enrollmentsService.create(
        {
          tenant_id: link.tenant_id,
          student_id: student.student_id,
          course_id: link.course_id,
        },
        queryRunner.manager, // ✅ IMPORTANT
      );

      // 4️⃣ Mark link as completed
      link.status = AdmissionStatus.COMPLETED;
      link.completed_at = new Date();

      await queryRunner.manager.save(link);

      // ✅ COMMIT
      await queryRunner.commitTransaction();

      return {
        success: true,
        student_id: student.student_id,
        auto_login: true,
        email: student.email,
        password: dto.password,
      };
    } catch (error) {
      // ❌ ROLLBACK
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ----------------------------------
  // ADMIN: List admissions
  // ----------------------------------
  async listAdmissions(user: any) {
    return this.linkRepo.find({
      where: { tenant_id: user.tenant_id },
      order: { created_at: 'DESC' },
    });
  }

  /* // ----------------------------------
  // ADMIN: Create link (alt endpoint)
  // ----------------------------------
  async createLink(
    tenant_id: string,
    created_by: string,
    dto: CreateAdmissionLinkDto,
  ) {
    const token = randomBytes(32).toString('hex');

    const link = this.linkRepo.create({
      tenant_id,
      created_by,
      student_email: dto.student_email.toLowerCase(),
      student_name: dto.student_name ?? null,
      course_id: dto.course_id,
      course_name: dto.course_name,
      amount: dto.amount ?? null,
      token,
      expires_at: new Date(dto.expires_at),
      status: AdmissionStatus.PENDING,
    } as Partial<AdmissionLink>);

    return this.linkRepo.save(link);
  } */
}

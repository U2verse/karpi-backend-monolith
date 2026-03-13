// src/enrollments/enrollments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from '../../shared/entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Student } from '../../shared/entities/student.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly repo: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
  ) {}

  // ----------------------------
  // CREATE (ADMISSION-SAFE)
  // ----------------------------
  async create(
    data: {
      tenant_id: string;
      student_id: string;
      course_id: string;
      course_start_date?: string | null;
      status?: EnrollmentStatus;
    },
    manager?: EntityManager, // ✅ ADD
  ) {
    const repo = manager
      ? manager.getRepository(Enrollment)
      : this.repo;

    const studentRepo = manager
      ? manager.getRepository(Student)
      : this.studentsRepo;

    const student = await studentRepo.findOne({
      where: {
        tenant_id: data.tenant_id,
        student_id: data.student_id,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const existing = await repo.findOne({
      where: {
        tenant_id: data.tenant_id,
        student: { student_id: data.student_id },
        course_id: data.course_id,
      },
    });

    if (existing) {
      return existing;
    }

    const record = repo.create({
      tenant_id: data.tenant_id,
      student,
      course_id: data.course_id,
      course_start_date: data.course_start_date ?? null,
      status: data.status ?? EnrollmentStatus.ACTIVE,
    });

    return repo.save(record);
  }

  // ----------------------------
  // READ
  // ----------------------------
  findAll(tenant_id: string) {
    return this.repo.find({
      where: { tenant_id },
      relations: ['student'],
      order: { enrolled_at: 'DESC' },
    });
  }

  async findOne(tenant_id: string, enrollment_id: string) {
    const enrollment = await this.repo.findOne({
      where: { tenant_id, enrollment_id },
      relations: ['student'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  // ----------------------------
  // UPDATE (SAFE)
  // ----------------------------
  async update(
    tenant_id: string,
    enrollment_id: string,
    dto: UpdateEnrollmentDto,
  ) {
    const enrollment = await this.findOne(tenant_id, enrollment_id);

    Object.assign(enrollment, {
      course_id: dto.course_id ?? enrollment.course_id,
      course_start_date:
        dto.course_start_date ?? enrollment.course_start_date,
      status: dto.status ?? enrollment.status,
    });

    return this.repo.save(enrollment);
  }

  // ----------------------------
  // DELETE
  // ----------------------------
  async remove(tenant_id: string, enrollment_id: string) {
    const enrollment = await this.findOne(tenant_id, enrollment_id);
    await this.repo.remove(enrollment);
    return { success: true };
  }

  // ----------------------------
  // FIND BY STUDENT
  // ----------------------------
  findByStudent(tenant_id: string, student_id: string) {
    return this.repo.find({
      where: {
        tenant_id,
        student: { student_id },
      },
      relations: ['student'],
      order: { enrolled_at: 'DESC' },
    });
  }
}

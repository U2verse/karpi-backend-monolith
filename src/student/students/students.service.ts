// src/students/students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, StudentStatus } from '../../shared/entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly repo: Repository<Student>,
  ) {}

  // ----------------------------
  // CREATE
  // ----------------------------
  async create(dto: CreateStudentDto) {
    const entity = this.repo.create({
      tenant_id: dto.tenant_id,
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      parent_name: dto.parent_name ?? null,
      profile_image: dto.profile_image ?? null,
      status: StudentStatus.ACTIVE,
    });

    return this.repo.save(entity);
  }

  // ----------------------------
  // CREATE FROM ADMISSION LINK
  // ----------------------------
  async createFromAdmission(
    data: {
      tenant_id: string;
      email: string;
      name: string;
      phone?: string;
      password: string;
    },
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(Student) : this.repo;

    const password_hash = await bcrypt.hash(data.password, 10);

    const existing = await repo
      .createQueryBuilder('s')
      .addSelect('s.password_hash')
      .where('s.tenant_id = :tenant_id AND s.email = :email', {
        tenant_id: data.tenant_id,
        email: data.email.toLowerCase(),
      })
      .getOne();

    if (existing) {
      // Update password on re-admission
      existing.password_hash = password_hash;
      return repo.save(existing);
    }

    const student = repo.create({
      tenant_id: data.tenant_id,
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone ?? null,
      password_hash,
      status: StudentStatus.ACTIVE,
    });

    return repo.save(student);
  }


  // ----------------------------
  // READ
  // ----------------------------
  findAll(tenant_id: string) {
    return this.repo.find({
      where: { tenant_id },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(tenant_id: string, student_id: string) {
    const student = await this.repo.findOne({
      where: { tenant_id, student_id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  // ----------------------------
  // UPDATE (SAFE)
  // ----------------------------
  async update(
    tenant_id: string,
    student_id: string,
    data: UpdateStudentDto,
  ) {
    const student = await this.findOne(tenant_id, student_id);

    Object.assign(student, {
      name: data.name ?? student.name,
      phone: data.phone ?? student.phone,
      parent_name: data.parent_name ?? student.parent_name,
      profile_image: data.profile_image ?? student.profile_image,
      status: data.status ?? student.status,
    });

    return this.repo.save(student);
  }

  // ----------------------------
  // DELETE (SOFT LOGIC READY)
  // ----------------------------
  async remove(tenant_id: string, student_id: string) {
    const student = await this.findOne(tenant_id, student_id);

    await this.repo.remove(student);

    return { success: true };
  }

  

}

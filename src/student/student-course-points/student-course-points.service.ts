import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentCoursePoints } from '../../shared/entities/student-course-points.entity';
import { CreateStudentCoursePointsDto } from './dto/create-student-course-points.dto';
import { UpdateStudentCoursePointsDto } from './dto/update-student-course-points.dto';

@Injectable()
export class StudentCoursePointsService {
  constructor(
    @InjectRepository(StudentCoursePoints)
    private readonly repo: Repository<StudentCoursePoints>,
  ) {}

  create(dto: CreateStudentCoursePointsDto, tenant_id: string) {
    const record = this.repo.create({ ...dto, tenant_id });
    return this.repo.save(record);
  }

  findAll(tenant_id: string) {
    return this.repo.find({ where: { tenant_id } });
  }

  findByStudent(tenant_id: string, student_id: string) {
    return this.repo.find({ where: { tenant_id, student_id } });
  }

  findOne(tenant_id: string, points_id: string) {
    return this.repo.findOne({ where: { tenant_id, points_id } });
  }

  async update(
    tenant_id: string,
    points_id: string,
    dto: UpdateStudentCoursePointsDto,
  ) {
    await this.repo.update({ tenant_id, points_id }, dto);
    return this.findOne(tenant_id, points_id);
  }

  async remove(tenant_id: string, points_id: string) {
    await this.repo.delete({ tenant_id, points_id });
    return { success: true };
  }
}

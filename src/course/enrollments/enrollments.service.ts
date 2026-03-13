import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEnrollment } from './enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(CourseEnrollment)
    private readonly repo: Repository<CourseEnrollment>,
  ) {}

  create(dto: CreateEnrollmentDto) {
    const enrollment = this.repo.create(dto);
    return this.repo.save(enrollment);
  }

  findByCourse(courseId: string) {
    return this.repo.find({ where: { course_id: courseId } });
  }

  findByStudent(studentId: string) {
    return this.repo.find({ where: { student_id: studentId } });
  }
}

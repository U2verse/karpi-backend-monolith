// src/students/students.module.ts

import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../../shared/entities/student.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentDashboardController } from './students.dashboard.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { StudentCoursePointsModule } from '../student-course-points/student-course-points.module';
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), forwardRef(() => EnrollmentsModule), forwardRef(() => StudentCoursePointsModule)],
  providers: [StudentsService],
  controllers: [StudentsController,StudentDashboardController],
  exports: [StudentsService],
})
export class StudentsModule {}

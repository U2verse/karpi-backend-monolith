import { Module } from '@nestjs/common';
import { StudentsModule } from './students/students.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { StudentCoursePointsModule } from './student-course-points/student-course-points.module';

@Module({
  imports: [
    StudentsModule,
    EnrollmentsModule,
    AdmissionsModule,
    StudentCoursePointsModule,
  ],
})
export class StudentModule {}

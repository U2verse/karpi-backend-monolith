import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentCoursePoints } from '../../shared/entities/student-course-points.entity';
import { StudentCoursePointsController } from './student-course-points.controller';
import { StudentCoursePointsService } from './student-course-points.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentCoursePoints])],
  controllers: [StudentCoursePointsController],
  providers: [StudentCoursePointsService],
  exports: [StudentCoursePointsService],
})
export class StudentCoursePointsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';

import { Course } from './courses.entity';
import { CourseModule } from '../course-modules/course-module.entity';
import { Lesson } from '../lessons/lesson.entity';
import { LessonProgress } from '../progress/lesson-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseModule,
      Lesson,           // ✅ ADD THIS
      LessonProgress,   // ✅ ADD THIS
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}

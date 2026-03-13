import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';

import { LessonProgress } from './lesson-progress.entity';
import { Lesson } from '../lessons/lesson.entity'; // 🔥 REQUIRED

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonProgress,
      Lesson, // 🔥 THIS FIXES THE ERROR
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}

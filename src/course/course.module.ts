import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { CourseModulesModule } from './course-modules/course-modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    CoursesModule,
    CourseModulesModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    ReviewsModule,
  ],
})
export class CourseModule {}

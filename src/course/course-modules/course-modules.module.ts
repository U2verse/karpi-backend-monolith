import { Module } from '@nestjs/common';
import { CourseModulesService } from './course-modules.service';
import { CourseModulesController } from './course-modules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseModule } from './course-module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseModule])],
  controllers: [CourseModulesController],
  providers: [CourseModulesService],
  exports: [CourseModulesService],
})
export class CourseModulesModule {}

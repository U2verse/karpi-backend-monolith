import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentCoursePointsDto } from './create-student-course-points.dto';

export class UpdateStudentCoursePointsDto extends PartialType(
  CreateStudentCoursePointsDto,
) {}

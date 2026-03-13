import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStudentCoursePointsDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  course_id: string;

  @IsOptional()
  @IsInt()
  points_from_assignments?: number;

  @IsOptional()
  @IsInt()
  points_from_progress?: number;

  @IsOptional()
  @IsInt()
  total_points?: number;

  @IsOptional()
  @IsInt()
  levels?: number;

  @IsOptional()
  @IsString()
  awards?: string;
}

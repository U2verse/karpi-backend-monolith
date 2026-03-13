import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { EnrollmentStatus } from '../../../shared/entities/enrollment.entity';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsUUID()
  course_id?: string;

  @IsOptional()
  course_start_date?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}

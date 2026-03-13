import { IsDateString, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '../../../shared/entities/enrollment.entity';

export class CreateEnrollmentDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  course_id: string;

  @IsOptional()
  @IsDateString()
  course_start_date?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}

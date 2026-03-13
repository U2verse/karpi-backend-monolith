import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StudentStatus } from '../../../shared/entities/student.entity';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  parent_name?: string;

  @IsOptional()
  @IsString()
  profile_image?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}

// src/students/dto/create-student.dto.ts
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { StudentStatus } from '../../../shared/entities/student.entity';

export class CreateStudentDto {
  @IsString()
  tenant_id: string; // or derive from JWT and omit from body

  @IsString()
  name: string;

  @IsEmail()
  email: string;

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

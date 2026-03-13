import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdmissionDto {
  // 👤 Student
  @IsEmail()
  student_email: string;

  @IsOptional()
  @IsNotEmpty()
  student_name?: string;

  // 📘 Course
  @IsOptional()
  @Type(() => Number) 
  course_id?: number;

  @IsNotEmpty()
  course_name: string;

  // 💰 Fees
  @IsOptional()
  @Type(() => Number) 
  @IsNumber()
  amount?: number;

  // ⏳ Expiry
  @IsDateString()
  expires_at: string;
}

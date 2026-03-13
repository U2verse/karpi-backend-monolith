import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateAdmissionLinkDto {
  @IsEmail()
  student_email: string;

  @IsOptional()
  @IsString()
  student_name?: string;

  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsString()
  course_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  // Optional — defaults to 48 hours from now if omitted
  @IsOptional()
  @IsDateString()
  expires_at?: string;
}

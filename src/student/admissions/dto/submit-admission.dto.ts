import { IsEmail, IsString, IsOptional,IsNotEmpty,MinLength } from 'class-validator';

export class SubmitAdmissionDto {
  @IsEmail()
  @IsOptional()
  student_email?: string;

  @IsOptional()
  @IsString()
  student_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  parent_name?: string;

  // 🔐 REQUIRED for auto-login
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}

import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";

export class CreateEnrollmentInviteDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsNumber()
  planId?: number;
}

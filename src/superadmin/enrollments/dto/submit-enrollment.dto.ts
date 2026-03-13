import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from "class-validator";

export class SubmitEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsNumber()
  plan_id: number;

  @IsString()
  @IsIn(['monthly', 'yearly'])
  billing_type: 'monthly' | 'yearly';

  @IsString()
  academy_name: string;

  @IsString()
  owner_name: string;

  @IsString()
  contact_email: string;

  @IsString()
  phone: string;

  @IsString()
  subdomain: string;

  @IsString()
  billing_name: string;

  @IsString()
  address_line1: string;

  @IsString()
  @IsOptional()
  address_line2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  pincode: string;

  @IsString()
  @IsOptional()
  gst_number?: string;

  @IsString()
  @IsOptional()
  pan_number?: string;
}

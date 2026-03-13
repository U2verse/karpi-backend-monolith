import { IsOptional, IsString } from 'class-validator';

export class CreateClientLandingPageDto {
  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  about_section?: string;

  @IsOptional()
  testimonials?: any;

  @IsOptional()
  achievements?: any;

  @IsOptional()
  courses_preview?: any;
}

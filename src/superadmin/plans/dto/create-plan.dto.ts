import {
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanLimitsDto {
  // UI sends number string or "Unlimited"
  @IsString()
  storage_mb: string;

  @IsString()
  student_limit: string;

  @IsString()
  course_limit: string;

  @IsString()
  video_limit: string;

  @IsString()
  assignment_limit: string;

  @IsString()
  @IsOptional()
  materials_per_course?: string;

  @IsString()
  admin_logins: string;
}

export class CreatePlanFeaturesDto {
  @IsBoolean()
  @IsOptional()
  student_app_access?: boolean;

  @IsString()
  @IsOptional()
  certificates?: string;

  @IsBoolean()
  @IsOptional()
  custom_domain?: boolean;

  @IsBoolean()
  @IsOptional()
  subdomain?: boolean;

  @IsString()
  @IsOptional()
  analytics?: string;

  @IsString()
  @IsOptional()
  branding?: string;

  @IsString()
  @IsOptional()
  support_level?: string;
}

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  feature_type?: string;

  @IsString()
  @IsOptional()
  meaning?: string;

  // prices come as strings ("499", "0")
  @IsString()
  price_monthly: string;

  @IsString()
  @IsOptional()
  price_yearly?: string;

  @IsString()
  @IsOptional()
  save_percentage?: string;

  @IsBoolean()
  @IsOptional()
  best_pick?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @ValidateNested()
  @Type(() => CreatePlanLimitsDto)
  limits: CreatePlanLimitsDto;

  @ValidateNested()
  @Type(() => CreatePlanFeaturesDto)
  features: CreatePlanFeaturesDto;
}

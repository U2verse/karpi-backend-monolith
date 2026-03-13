import {
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlanLimitsDto {
  @IsString()
  @IsOptional()
  storage_mb?: string;

  @IsString()
  @IsOptional()
  student_limit?: string;

  @IsString()
  @IsOptional()
  course_limit?: string;

  @IsString()
  @IsOptional()
  video_limit?: string;

  @IsString()
  @IsOptional()
  assignment_limit?: string;

  @IsString()
  @IsOptional()
  materials_per_course?: string;

  @IsString()
  @IsOptional()
  admin_logins?: string;
}

export class UpdatePlanFeaturesDto {
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

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  feature_type?: string;

  @IsString()
  @IsOptional()
  meaning?: string;

  @IsString()
  @IsOptional()
  price_monthly?: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePlanLimitsDto)
  limits?: UpdatePlanLimitsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePlanFeaturesDto)
  features?: UpdatePlanFeaturesDto;
}

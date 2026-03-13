import { IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateBrandingDto {
  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  banner_url?: string;

  @IsOptional()
  @IsString()
  theme_color?: string;

  @IsOptional()
  @IsString()
  primary_color?: string;

  @IsOptional()
  @IsString()
  secondary_color?: string;

  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme_mode?: 'light' | 'dark';

  @IsOptional()
  @IsString()
  font_family?: string;
}

import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateClientSettingsDto {
  @IsBoolean()
  enable_chat!: boolean;

  @IsBoolean()
  enable_notifications!: boolean;

  @IsBoolean()
  enable_payment!: boolean;

  @IsBoolean()
  enable_landing_page!: boolean;

  @IsBoolean()
  certificate_auto_generate!: boolean;

  @IsEnum(['en', 'ta', 'te', 'hi'])
  language!: 'en' | 'ta' | 'te' | 'hi';

  @IsOptional()
  @IsString()
  timezone?: string;
}

import { IsString, IsUUID, IsOptional, IsInt } from 'class-validator';

export class CreateVariantDto {
  @IsUUID()
  video_id: string;

  @IsString()
  variant_label: string;

  @IsString()
  s3_key: string;

  @IsString()
  mime_type: string;

  @IsOptional() @IsInt()
  width?: number;

  @IsOptional() @IsInt()
  height?: number;

  @IsOptional() @IsInt()
  bitrate_kbps?: number;

  @IsOptional() @IsInt()
  size_bytes?: number;

  @IsOptional() @IsString()
  codec?: string;
}

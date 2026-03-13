import { IsString, IsUUID, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateThumbnailDto {
  @IsUUID()
  video_id: string;

  @IsString()
  s3_key: string;

  @IsOptional() @IsInt()
  width?: number;

  @IsOptional() @IsInt()
  height?: number;

  @IsOptional() @IsBoolean()
  is_default?: boolean;
}

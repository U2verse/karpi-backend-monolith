import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { VideoVisibility } from '../entities/video.enums';

export class CreateVideoDto {
  @IsUUID()
  @IsOptional()
  tenant_id: string;

  @IsUUID()
  @IsOptional()
  uploaded_by: string;

  @IsUUID()
  @IsOptional()
  course_id?: string;

  @IsUUID()
  @IsOptional()
  lesson_id?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  s3_key_prefix: string;

  @IsEnum(VideoVisibility)
  @IsOptional()
  visibility?: VideoVisibility;
}

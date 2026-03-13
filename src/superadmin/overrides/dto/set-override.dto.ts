import { IsInt, IsOptional, IsString } from 'class-validator';

export class SetOverrideDto {
  @IsInt()
  client_id: number;

  @IsOptional()
  @IsInt()
  override_storage_mb?: number;

  @IsOptional()
  @IsInt()
  override_students?: number;

  @IsOptional()
  @IsInt()
  override_courses?: number;

  @IsOptional()
  @IsInt()
  override_videos?: number;

  @IsOptional()
  @IsInt()
  override_assignments?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

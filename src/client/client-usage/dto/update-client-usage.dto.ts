import { IsInt, IsOptional } from 'class-validator';

export class UpdateClientUsageDto {
  @IsOptional()
  @IsInt()
  total_storage_used_mb?: number;

  @IsOptional()
  @IsInt()
  students_used?: number;

  @IsOptional()
  @IsInt()
  courses_used?: number;

  @IsOptional()
  @IsInt()
  videos_used?: number;

  @IsOptional()
  @IsInt()
  assignments_used?: number;
}

import { IsInt, IsOptional } from 'class-validator';

export class CreateClientUsageDto {
  @IsInt()
  total_storage_used_mb!: number;

  @IsInt()
  storage_limit_mb!: number;

  @IsInt()
  students_used!: number;

  @IsInt()
  students_limit!: number;

  @IsInt()
  courses_used!: number;

  @IsInt()
  courses_limit!: number;

  @IsInt()
  videos_used!: number;

  @IsInt()
  videos_limit!: number;

  @IsInt()
  assignments_used!: number;

  @IsInt()
  assignments_limit!: number;

  @IsOptional()
  last_reset_at?: Date;
}

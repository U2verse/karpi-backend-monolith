import { IsInt } from 'class-validator';

export class InitClientUsageDto {
  @IsInt()
  storage_limit_mb!: number;

  @IsInt()
  students_limit!: number;

  @IsInt()
  courses_limit!: number;

  @IsInt()
  videos_limit!: number;

  @IsInt()
  assignments_limit!: number;
}

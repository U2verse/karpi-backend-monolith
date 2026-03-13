import { IsBoolean, IsNumber, IsUUID } from 'class-validator';

export class UpdateProgressDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsUUID()
  lesson_id: string;

  @IsUUID()
  course_id: string;

  @IsBoolean()
  completed: boolean;

  status: 'IN_PROGRESS' | 'COMPLETED';
}

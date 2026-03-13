import { IsUUID } from 'class-validator';

export class CompleteLessonDto {
  @IsUUID()
  lesson_id: string;

  @IsUUID()
  course_id: string;
}

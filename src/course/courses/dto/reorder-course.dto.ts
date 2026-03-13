import { IsArray, IsUUID, IsNumber } from 'class-validator';

class LessonOrderDto {
  @IsUUID()
  id: string;

  @IsNumber()
  order_index: number;
}

class ModuleOrderDto {
  @IsUUID()
  id: string;

  @IsNumber()
  order_index: number;

  @IsArray()
  lessons: LessonOrderDto[];
}

export class ReorderCourseDto {
  @IsArray()
  modules: ModuleOrderDto[];
}

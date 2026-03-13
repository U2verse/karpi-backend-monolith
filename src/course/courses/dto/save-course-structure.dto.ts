import { IsArray, IsString, ValidateNested, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class LessonDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title: string;

  @IsIn(['video', 'text'])
  type: 'video' | 'text';

  @IsOptional()
  @IsString()
  video_id?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class ModuleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  lessons: LessonDto[];
}

export class SaveCourseStructureDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleDto)
  modules: ModuleDto[];
}

import { IsString, IsUUID, Length } from 'class-validator';

export class CreateCaptionDto {
  @IsUUID()
  video_id: string;

  @Length(2, 8)
  language_code: string;

  @IsString()
  s3_key: string;

  @IsString()
  format: string; // vtt, srt
}

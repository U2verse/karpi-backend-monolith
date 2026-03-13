import { IsInt, IsString } from 'class-validator';

export class ChangeStatusDto {
  @IsInt()
  client_id: number;

  @IsString()
  previous_status: string;

  @IsString()
  new_status: string;

  @IsString()
  reason: string;
}

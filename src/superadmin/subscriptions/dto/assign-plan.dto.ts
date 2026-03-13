import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';

export class AssignPlanDto {
  @IsInt()
  client_id: number;

  @IsInt()
  plan_id: number;

  @IsEnum(['monthly', 'yearly'])
  renew_type: 'monthly' | 'yearly';

  @IsOptional()
  @IsDateString()
  start_date?: string; // optional, default = today
}

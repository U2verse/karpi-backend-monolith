import { IsInt, IsEnum, IsOptional } from 'class-validator';

export class UpgradePlanDto {
  @IsInt()
  client_id: number;

  @IsInt()
  current_subscription_id: number;

  @IsInt()
  new_plan_id: number;

  @IsOptional() // upgrade may keep same billing cycle
  @IsEnum(['monthly', 'yearly'])
  renew_type?: 'monthly' | 'yearly';
}

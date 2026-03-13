import { IsInt } from 'class-validator';

export class CancelSubscriptionDto {
  @IsInt()
  subscription_id: number;
}

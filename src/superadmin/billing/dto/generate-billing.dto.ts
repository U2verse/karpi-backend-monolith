import { IsInt, IsNumber } from 'class-validator';

export class GenerateBillingDto {
  @IsInt()
  client_id: number;

  @IsInt()
  subscription_id: number;

  @IsNumber()
  amount: number;
}

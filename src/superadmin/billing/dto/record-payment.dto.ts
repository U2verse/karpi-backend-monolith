import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class RecordPaymentDto {
  @IsInt()
  billing_id: number;

  @IsEnum(['paid', 'pending', 'failed'])
  status: 'paid' | 'pending' | 'failed';

  @IsOptional()
  @IsString()
  transaction_id?: string;

  @IsOptional()
  @IsString()
  invoice_url?: string;
}

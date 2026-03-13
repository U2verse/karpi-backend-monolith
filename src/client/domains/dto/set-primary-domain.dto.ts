import { IsNumber } from 'class-validator';

export class SetPrimaryDomainDto {
  @IsNumber()
  domain_id: number;
}

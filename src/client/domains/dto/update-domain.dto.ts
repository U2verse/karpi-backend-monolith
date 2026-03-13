import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import type { DomainType } from '../../../shared/entities/domain.entity';
import { CreateDomainDto } from './create-domain.dto';

export class UpdateDomainDto extends PartialType(CreateDomainDto) {
  @IsOptional()
  @Matches(
    /^(?!:\/\/)(?=.{1,253}$)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/,
    { message: 'Invalid domain format' }
  )
  domain?: string;

  @IsOptional()
  @IsIn(['subdomain', 'custom'], {
    message: 'type must be either "subdomain" or "custom"',
  })
  type?: DomainType;

  @IsOptional()
  @IsString()
  verification_code?: string;
}

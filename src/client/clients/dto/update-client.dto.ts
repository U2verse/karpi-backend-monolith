import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString, Matches, Length } from 'class-validator';
import type { ClientDomainType, ClientStatus } from '../../../shared/entities/client.entity';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @IsOptional()
  @Length(3, 255)
  name?: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can contain lowercase letters, numbers, and hyphens only',
  })
  subdomain?: string;

  @IsOptional()
  @Matches(
    /^(?!:\/\/)(?=.{1,253}$)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/,
    { message: 'Invalid custom domain format' }
  )
  custom_domain?: string;

  @IsOptional()
  @IsIn(['subdomain', 'custom'])
  domain_type?: ClientDomainType;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: ClientStatus;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  theme_color?: string;
}

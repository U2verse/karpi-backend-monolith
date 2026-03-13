import { IsString, IsOptional, IsIn, Length, Matches } from 'class-validator';
import type { ClientDomainType, ClientStatus } from '../../../shared/entities/client.entity';

export class CreateClientDto {
  @IsString()
  @Length(3, 255)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can contain lowercase letters, numbers, and hyphens only',
  })
  subdomain: string;

  @IsOptional()
  @Matches(
    /^(?!:\/\/)(?=.{1,253}$)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/,
    { message: 'Invalid custom domain format' }
  )
  custom_domain?: string;

  @IsIn(['subdomain', 'custom'])
  domain_type: ClientDomainType;

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

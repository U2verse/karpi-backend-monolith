import { IsString, IsEmail, IsOptional, IsJSON } from 'class-validator';

export class CreateClientProfileDto {
  @IsString()
  academy_name!: string;

  @IsString()
  owner_name!: string;

  @IsEmail()
  contact_email!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  services?: any;
}

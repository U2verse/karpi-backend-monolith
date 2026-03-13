import { PartialType } from '@nestjs/mapped-types';
import { CreateClientLandingPageDto } from './create-client-landing-page.dto';

export class UpdateClientLandingPageDto extends PartialType(CreateClientLandingPageDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateClientSettingsDto } from './create-client-settings.dto';

export class UpdateClientSettingsDto extends PartialType(CreateClientSettingsDto) {}

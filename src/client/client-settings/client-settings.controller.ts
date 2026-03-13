import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ClientSettingsService } from './client-settings.service';
import { UpdateClientSettingsDto } from './dto/update-client-settings.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('clients/:client_id/settings')
@UseGuards(JwtAuthGuard)
export class ClientSettingsController {
  constructor(private service: ClientSettingsService) {}

  @Get()
  async getSettings(@Param('client_id') client_id: number) {
    return this.service.getByClientId(client_id);
  }

  @Patch()
  async updateSettings(
    @Param('client_id') client_id: number,
    @Body() dto: UpdateClientSettingsDto,
  ) {
    return this.service.createOrUpdate(client_id, dto);
  }
}

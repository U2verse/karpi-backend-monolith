import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { ClientBrandingService } from './client-branding.service';
import { UpdateBrandingDto } from './dto/update-client-branding.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('clients/:client_id/branding')
@UseGuards(JwtAuthGuard)
export class ClientBrandingController {
  constructor(private service: ClientBrandingService) {}

  @Get()
  async getBranding(@Param('client_id') client_id: string) {
    return this.service.getByClientId(client_id);
  }

  @Patch()
  async updateBranding(
    @Param('client_id') client_id: string,
    @Body() dto: UpdateBrandingDto,
  ) {
    return this.service.createOrUpdate(client_id, dto);
  }
}

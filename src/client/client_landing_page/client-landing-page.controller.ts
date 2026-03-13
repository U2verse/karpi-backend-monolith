import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ClientLandingPageService } from './client-landing-page.service';
import { UpdateClientLandingPageDto } from './dto/update-client-landing-page.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('clients/:client_id/landing-page')
@UseGuards(JwtAuthGuard)
export class ClientLandingPageController {
  constructor(private service: ClientLandingPageService) {}

  @Get()
  async getLandingPage(@Param('client_id') client_id: string) {
    return this.service.getByClientId(client_id);
  }

  @Patch()
  async updateLandingPage(
    @Param('client_id') client_id: string,
    @Body() dto: UpdateClientLandingPageDto,
  ) {
    return this.service.createOrUpdate(client_id, dto);
  }
}

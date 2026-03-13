import { Controller, Get, Param, Patch, Body, Post, UseGuards } from '@nestjs/common';
import { ClientProfileService } from './client-profile.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('clients/:client_id/profile')
@UseGuards(JwtAuthGuard)
export class ClientProfileController {
  constructor(private service: ClientProfileService) {}

  @Get()
  async getProfile(@Param('client_id') client_id: string) {
    return this.service.getByClientId(client_id);
  }

  @Post()
  async createProfile(
    @Param('client_id') client_id: string,
    @Body() dto: CreateClientProfileDto,
  ) {
    return this.service.createOrUpdate(client_id, dto);
  }

  @Patch()
  async updateProfile(
    @Param('client_id') client_id: string,
    @Body() dto: UpdateClientProfileDto,
  ) {
    return this.service.createOrUpdate(client_id, dto);
  }
}

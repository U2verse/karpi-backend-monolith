import { Controller, Get, Patch, Param, Body, Post, Headers, ForbiddenException, UseGuards } from '@nestjs/common';
import { ClientUsageService } from './client-usage.service';
import { UpdateClientUsageDto } from './dto/update-client-usage.dto';
import { CreateClientUsageDto } from './dto/create-client-usage.dto';
import { InitClientUsageDto } from './dto/init-client-usage.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('clients/:client_id/usage')
@UseGuards(JwtAuthGuard)
export class ClientUsageController {
  constructor(private service: ClientUsageService) {}

  @Get()
  getUsage(@Param('client_id') client_id: number) {
    return this.service.getByClientId(client_id);
  }

  @Patch()
  updateUsage(
    @Param('client_id') client_id: number,
    @Body() dto: UpdateClientUsageDto,
  ) {
    return this.service.createOrUpdate(client_id, dto);
  }

  @Post('reset')
  resetUsage(@Param('client_id') client_id: number) {
    return this.service.resetUsage(client_id);
  }

  @Post('init')
  initUsage(
    @Param('client_id') client_id: number,
    @Body() dto: InitClientUsageDto,
    @Headers('x-internal-secret') secret: string,
  ) {
    if (secret !== process.env.INTERNAL_ADMIN_TOKEN) {
      throw new ForbiddenException();
    }

    return this.service.createOrUpdate(client_id, {
      storage_limit_mb: dto.storage_limit_mb,
      students_limit: dto.students_limit,
      courses_limit: dto.courses_limit,
      videos_limit: dto.videos_limit,
      assignments_limit: dto.assignments_limit,
      last_reset_at: new Date(),
    });
  }
}

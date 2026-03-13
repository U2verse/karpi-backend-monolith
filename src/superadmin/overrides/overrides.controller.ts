import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OverridesService } from './overrides.service';
import { SetOverrideDto } from './dto/set-override.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('overrides')
@UseGuards(SuperAdminGuard)
export class OverridesController {
  constructor(private readonly overridesService: OverridesService) {}

  @Post()
  set(@Body() dto: SetOverrideDto) {
    return this.overridesService.setOverride(dto);
  }

  @Get(':clientId')
  get(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.overridesService.findByClient(clientId);
  }

  @Delete(':clientId')
  delete(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.overridesService.deleteByClient(clientId);
  }
}

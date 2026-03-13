import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsageService } from './usage.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('usage')
@UseGuards(SuperAdminGuard)
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get(':clientId')
  get(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.usageService.findByClient(clientId);
  }

  // optional manual endpoint to create usage record
  @Post(':clientId/:month')
  create(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Param('month') month: string,
    @Body()
    body: {
      storage_used_mb: number;
      students_used: number;
      videos_used: number;
      courses_used: number;
    },
  ) {
    return this.usageService.generateMonthlyForClient(clientId, month, body);
  }
}

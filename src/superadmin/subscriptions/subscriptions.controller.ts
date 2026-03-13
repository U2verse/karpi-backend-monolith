import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { InternalGuard } from '../common/guards/internal.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subsService: SubscriptionsService) {}

  @Post('assign')
  @UseGuards(InternalGuard)
  assign(@Body() dto: AssignPlanDto) {
    return this.subsService.assignPlan(dto);
  }

  @Post('upgrade')
  @UseGuards(InternalGuard)
  upgrade(@Body() dto: UpgradePlanDto) {
    return this.subsService.upgradePlan(dto);
  }

  @Post('cancel')
  @UseGuards(SuperAdminGuard)
  cancel(@Body() dto: CancelSubscriptionDto) {
    return this.subsService.cancel(dto);
  }

  @Get('client/:clientId')
  @UseGuards(SuperAdminGuard)
  findByClient(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.subsService.findByClient(clientId);
  }
}

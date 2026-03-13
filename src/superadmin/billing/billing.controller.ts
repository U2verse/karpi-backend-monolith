import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { GenerateBillingDto } from './dto/generate-billing.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('billing')
@UseGuards(SuperAdminGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('generate')
  generate(@Body() dto: GenerateBillingDto) {
    return this.billingService.generate(dto);
  }

  @Post('record-payment')
  recordPayment(@Body() dto: RecordPaymentDto) {
    return this.billingService.recordPayment(dto);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.billingService.findByClient(clientId);
  }
}

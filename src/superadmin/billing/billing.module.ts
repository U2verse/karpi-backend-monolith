import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Billing } from '../../shared/entities/billing.entity';
import { ClientPlanSubscription } from '../../shared/entities/client-plan-subscription.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { SuperAdminCommonModule } from '../common/super-admin-common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Billing, ClientPlanSubscription]), SuperAdminCommonModule],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}

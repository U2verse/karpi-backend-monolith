import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientPlanSubscription } from '../../shared/entities/client-plan-subscription.entity';
import { Plan } from '../../shared/entities/plan.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SuperAdminCommonModule } from '../common/super-admin-common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClientPlanSubscription, Plan]), SuperAdminCommonModule],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

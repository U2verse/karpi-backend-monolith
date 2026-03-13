import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../../shared/entities/plan.entity';
import { PlanLimits } from '../../shared/entities/plan-limits.entity';
import { PlanFeatures } from '../../shared/entities/plan-features.entity';
import { ClientPlanSubscription } from '../../shared/entities/client-plan-subscription.entity';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { SuperAdminCommonModule } from '../common/super-admin-common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, PlanLimits, PlanFeatures, ClientPlanSubscription]),
    SuperAdminCommonModule,
  ],
  providers: [PlansService],
  controllers: [PlansController],
  exports: [PlansService],
})
export class PlansModule {}

import { Module } from '@nestjs/common';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { BillingModule } from './billing/billing.module';
import { OverridesModule } from './overrides/overrides.module';
import { StatusLogsModule } from './status-logs/status-logs.module';
import { UsageModule } from './usage/usage.module';
import { EnrollmentInvitesModule } from './enrollments/enrollment_invites.module';
import { PaymentsModule } from './payments/payments.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AdminBridgeModule } from './admin-bridge/admin-bridge.module';

@Module({
  imports: [
    PlansModule,
    SubscriptionsModule,
    BillingModule,
    OverridesModule,
    StatusLogsModule,
    UsageModule,
    EnrollmentInvitesModule,
    PaymentsModule,
    WhatsappModule,
    AdminBridgeModule,
  ],
})
export class SuperadminModule {}

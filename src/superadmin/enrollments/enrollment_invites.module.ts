import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EnrollmentInvite } from "./enrollment_invite.entity";
import { EnrollmentInvitesService } from "./enrollment_invites.service";
import { EnrollmentInvitesController } from "./enrollment_invites.controller";
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ClientsModule } from '../../client/clients/clients.module';
import { ClientUsageModule } from '../../client/client-usage/client-usage.module';
import { ClientProfileModule } from '../../client/client-profile/client-profile.module';
import { ClientSettingsModule } from '../../client/client-settings/client-settings.module';
import { ClientBrandingModule } from '../../client/client-branding/client-branding.module';
import { ClientLandingPageModule } from '../../client/client_landing_page/client-landing-page.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnrollmentInvite]),
    WhatsappModule,
    ClientsModule,
    ClientUsageModule,
    ClientProfileModule,
    ClientSettingsModule,
    ClientBrandingModule,
    ClientLandingPageModule,
    SubscriptionsModule,
  ],
  providers: [EnrollmentInvitesService],
  controllers: [EnrollmentInvitesController],
  exports: [EnrollmentInvitesService],
})
export class EnrollmentInvitesModule {}

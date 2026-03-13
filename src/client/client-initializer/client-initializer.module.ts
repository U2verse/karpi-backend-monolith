import { Module } from '@nestjs/common';
import { ClientInitializerService } from './client-initializer.service';
import { ClientBrandingModule } from '../client-branding/client-branding.module';
import { ClientProfileModule } from '../client-profile/client-profile.module';
import { ClientUsageModule } from '../client-usage/client-usage.module';
import { ClientSettingsModule } from '../client-settings/client-settings.module';
import { ClientLandingPageModule } from '../client_landing_page/client-landing-page.module';

@Module({
  imports: [
    ClientBrandingModule,
    ClientProfileModule,
    ClientUsageModule,
    ClientSettingsModule,
    ClientLandingPageModule,
  ],
  providers: [ClientInitializerService],
  exports: [ClientInitializerService],
})
export class ClientInitializerModule {}

import { Module } from '@nestjs/common';

import { ClientsModule } from './clients/clients.module';
import { DomainsModule } from './domains/domains.module';
import { ClientUsageModule } from './client-usage/client-usage.module';
import { ClientSettingsModule } from './client-settings/client-settings.module';
import { ClientProfileModule } from './client-profile/client-profile.module';  
import { ClientInitializerModule } from './client-initializer/client-initializer.module';
import { ClientBrandingModule } from './client-branding/client-branding.module';
import { ClientLandingPageModule } from './client_landing_page/client-landing-page.module';

@Module({
  imports: [
    ClientsModule,
    DomainsModule,
    ClientUsageModule,
    ClientSettingsModule,
    ClientProfileModule,
    ClientInitializerModule,
    ClientBrandingModule,
    ClientLandingPageModule
  ],
})
export class ClientModule {}

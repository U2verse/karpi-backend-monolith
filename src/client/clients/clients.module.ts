import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from '../../shared/entities/client.entity';
import { Domain } from '../../shared/entities/domain.entity';

import { ClientBrandingModule } from '../client-branding/client-branding.module';
import { ClientProfileModule } from '../client-profile/client-profile.module';
import { ClientUsageModule } from '../client-usage/client-usage.module';
import { ClientSettingsModule } from '../client-settings/client-settings.module';
import { ClientLandingPageModule } from '../client_landing_page/client-landing-page.module';
import { ClientInitializerModule } from '../client-initializer/client-initializer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client,Domain]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    ClientBrandingModule,
    ClientProfileModule,
    ClientUsageModule,
    ClientSettingsModule,
    ClientLandingPageModule,
    ClientInitializerModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}

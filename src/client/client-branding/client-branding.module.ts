import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClientBranding } from '../../shared/entities/client_branding.entity';
import { ClientBrandingService } from './client-branding.service';
import { ClientBrandingController } from './client-branding.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientBranding])],
  controllers: [ClientBrandingController],
  providers: [ClientBrandingService],
  exports: [ClientBrandingService],
})
export class ClientBrandingModule {}

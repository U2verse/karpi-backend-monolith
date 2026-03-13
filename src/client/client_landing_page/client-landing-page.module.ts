import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientLandingPage } from '../../shared/entities/client_landing_page.entity';
import { ClientLandingPageService } from './client-landing-page.service';
import { ClientLandingPageController } from './client-landing-page.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientLandingPage])],
  controllers: [ClientLandingPageController],
  providers: [ClientLandingPageService],
  exports: [ClientLandingPageService],
})
export class ClientLandingPageModule {}

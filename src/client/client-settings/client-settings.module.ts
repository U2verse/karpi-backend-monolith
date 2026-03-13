import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientSettings } from '../../shared/entities/client_settings.entity';
import { ClientSettingsService } from './client-settings.service';
import { ClientSettingsController } from './client-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientSettings])],
  controllers: [ClientSettingsController],
  providers: [ClientSettingsService],
  exports: [ClientSettingsService],
})
export class ClientSettingsModule {}

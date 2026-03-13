import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientUsage } from '../../shared/entities/client_usage.entity';
import { ClientUsageService } from './client-usage.service';
import { ClientUsageController } from './client-usage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientUsage])],
  controllers: [ClientUsageController],
  providers: [ClientUsageService],
  exports: [ClientUsageService],
})
export class ClientUsageModule {}

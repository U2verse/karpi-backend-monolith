import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientUsageHistory } from '../../shared/entities/client-usage-history.entity';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { SuperAdminCommonModule } from '../common/super-admin-common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClientUsageHistory]), SuperAdminCommonModule],
  providers: [UsageService],
  controllers: [UsageController],
})
export class UsageModule {}

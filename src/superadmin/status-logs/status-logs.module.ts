import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientStatusLog } from '../../shared/entities/client-status-log.entity';
import { StatusLogsService } from './status-logs.service';
import { StatusLogsController } from './status-logs.controller';
import { AdminBridgeModule } from '../admin-bridge/admin-bridge.module';
import { SuperAdminCommonModule } from '../common/super-admin-common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClientStatusLog]), AdminBridgeModule, SuperAdminCommonModule],
  providers: [StatusLogsService],
  controllers: [StatusLogsController],
})
export class StatusLogsModule {}

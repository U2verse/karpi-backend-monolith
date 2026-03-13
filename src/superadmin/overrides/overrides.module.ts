import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientLimitsOverride } from '../../shared/entities/client-limits-override.entity';
import { OverridesService } from './overrides.service';
import { OverridesController } from './overrides.controller';
import { SuperAdminCommonModule } from '../common/super-admin-common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClientLimitsOverride]), SuperAdminCommonModule],
  providers: [OverridesService],
  controllers: [OverridesController],
  exports: [OverridesService],
})
export class OverridesModule {}

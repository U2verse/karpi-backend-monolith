import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminBridgeService } from './admin-bridge.service';
import { Client } from '../../shared/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [AdminBridgeService],
  exports: [AdminBridgeService],
})
export class AdminBridgeModule {}

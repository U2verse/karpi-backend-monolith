import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientProfile } from '../../shared/entities/client_profile.entity';
import { ClientProfileService } from './client-profile.service';
import { ClientProfileController } from './client-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientProfile])],
  controllers: [ClientProfileController],
  providers: [ClientProfileService],
  exports: [ClientProfileService],
})
export class ClientProfileModule {}

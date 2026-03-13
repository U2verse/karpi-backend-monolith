// src/domains/domains.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

import { Domain } from '../../shared/entities/domain.entity';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { Client } from '../../shared/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Domain, Client]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    HttpModule,
  ],
  controllers: [DomainsController],
  providers: [DomainsService],
})
export class DomainsModule {}

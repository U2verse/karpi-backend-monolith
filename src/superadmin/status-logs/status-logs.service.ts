import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientStatusLog } from '../../shared/entities/client-status-log.entity';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AdminBridgeService } from '../admin-bridge/admin-bridge.service';

@Injectable()
export class StatusLogsService {
  constructor(
    @InjectRepository(ClientStatusLog)
    private readonly statusRepo: Repository<ClientStatusLog>,
    private readonly adminBridge: AdminBridgeService,
  ) {}

  async changeStatus(
    adminId: number,
    dto: ChangeStatusDto,
  ) {
    await this.adminBridge.changeClientStatus(
      dto.client_id,
      dto.new_status,
      dto.reason,
    );

    const log = this.statusRepo.create({
      client_id: dto.client_id,
      previous_status: dto.previous_status,
      new_status: dto.new_status,
      changed_by: adminId,
      reason: dto.reason,
    });

    return this.statusRepo.save(log);
  }

  findLogs(clientId: number) {
    return this.statusRepo.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }
}

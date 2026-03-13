import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientUsage } from '../../shared/entities/client_usage.entity';
import { CreateClientUsageDto } from './dto/create-client-usage.dto';
import { UpdateClientUsageDto } from './dto/update-client-usage.dto';

@Injectable()
export class ClientUsageService {
  constructor(
    @InjectRepository(ClientUsage)
    private repo: Repository<ClientUsage>,
  ) {}

  async getByClientId(client_id: number) {
    return this.repo.findOne({ where: { client_id } });
  }

  async createOrUpdate(
    client_id: number,
    dto: Partial<ClientUsage>,
  ) {
    let usage = await this.repo.findOne({ where: { client_id } });

    if (!usage) {
      usage = this.repo.create({ client_id, ...dto });
    } else {
      Object.assign(usage, dto);
    }

    return this.repo.save(usage);
  }

  async resetUsage(client_id: number) {
    const usage = await this.repo.findOne({ where: { client_id } });
    if (!usage) return null;

    usage.total_storage_used_mb = 0;
    usage.students_used = 0;
    usage.courses_used = 0;
    usage.videos_used = 0;
    usage.assignments_used = 0;
    usage.last_reset_at = new Date();

    return this.repo.save(usage);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ClientUsageHistory } from '../../shared/entities/client-usage-history.entity';
// In real usage, fetch usage data from other microservices
// via AdminBridgeService or direct HTTP calls.

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    @InjectRepository(ClientUsageHistory)
    private readonly usageRepo: Repository<ClientUsageHistory>,
  ) {}

  async generateMonthlyForClient(
    clientId: number,
    month: string,
    data: {
      storage_used_mb: number;
      students_used: number;
      videos_used: number;
      courses_used: number;
    },
  ) {
    const record = this.usageRepo.create({
      client_id: clientId,
      month,
      ...data,
    });
    return this.usageRepo.save(record);
  }

  findByClient(clientId: number) {
    return this.usageRepo.find({
      where: { client_id: clientId },
      order: { month: 'DESC' },
    });
  }

  @Cron('0 3 1 * *') // 3:00 AM on the 1st of every month
  async generateMonthlyUsageSnapshot() {
    this.logger.log('Running monthly usage aggregation job');
    // TODO: fetch list of clients + their usage from your other services
    // and call generateMonthlyForClient() for each.
  }
}

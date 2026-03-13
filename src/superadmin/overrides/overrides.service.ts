import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientLimitsOverride } from '../../shared/entities/client-limits-override.entity';
import { SetOverrideDto } from './dto/set-override.dto';

@Injectable()
export class OverridesService {
  constructor(
    @InjectRepository(ClientLimitsOverride)
    private readonly overrideRepo: Repository<ClientLimitsOverride>,
  ) {}

  async setOverride(dto: SetOverrideDto) {
    let override = await this.overrideRepo.findOne({
      where: { client_id: dto.client_id },
    });

    if (!override) {
      override = this.overrideRepo.create({ client_id: dto.client_id });
    }

    Object.assign(override, dto);

    return this.overrideRepo.save(override);
  }

  findByClient(clientId: number) {
    return this.overrideRepo.findOne({ where: { client_id: clientId } });
  }

  async deleteByClient(clientId: number) {
    await this.overrideRepo.delete({ client_id: clientId });
    return { deleted: true };
  }
}

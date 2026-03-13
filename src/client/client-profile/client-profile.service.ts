import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientProfile } from '../../shared/entities/client_profile.entity';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ClientProfileService {
  constructor(
    @InjectRepository(ClientProfile)
    private repo: Repository<ClientProfile>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  private async resolveClientId(param: string | number): Promise<number | null> {
    if (typeof param === 'number') return param;
    if (/^\d+$/.test(param)) return Number(param);
    if (UUID_RE.test(param)) {
      const [client] = await this.dataSource.query(
        `SELECT client_id FROM clients WHERE tenant_id = $1 LIMIT 1`,
        [param],
      );
      return client?.client_id ?? null;
    }
    return null;
  }

  async getByClientId(param: string | number) {
    const clientId = await this.resolveClientId(param);
    if (clientId === null) return null;
    return this.repo.findOne({ where: { client_id: clientId } });
  }

  async createOrUpdate(
    param: string | number,
    dto: CreateClientProfileDto | UpdateClientProfileDto,
  ) {
    const clientId = await this.resolveClientId(param);
    if (clientId === null) throw new NotFoundException('Client not found for this tenant');

    let profile = await this.repo.findOne({ where: { client_id: clientId } });
    if (!profile) {
      profile = this.repo.create({ client_id: clientId, ...dto });
    } else {
      Object.assign(profile, dto);
    }
    return this.repo.save(profile);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientBranding } from '../../shared/entities/client_branding.entity';
import { CreateBrandingDto } from './dto/create-client-branding.dto';
import { UpdateBrandingDto } from './dto/update-client-branding.dto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ClientBrandingService {
  constructor(
    @InjectRepository(ClientBranding)
    private repo: Repository<ClientBranding>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /** Resolves an integer client_id from a numeric value, numeric string, or UUID tenant_id. */
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

  async createOrUpdate(param: string | number, dto: CreateBrandingDto | UpdateBrandingDto) {
    const clientId = await this.resolveClientId(param);
    if (clientId === null) throw new NotFoundException('Client not found for this tenant');

    let branding = await this.repo.findOne({ where: { client_id: clientId } });
    if (!branding) {
      branding = this.repo.create({ client_id: clientId, ...dto });
    } else {
      Object.assign(branding, dto);
    }
    return this.repo.save(branding);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientLandingPage } from '../../shared/entities/client_landing_page.entity';
import { CreateClientLandingPageDto } from './dto/create-client-landing-page.dto';
import { UpdateClientLandingPageDto } from './dto/update-client-landing-page.dto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ClientLandingPageService {
  constructor(
    @InjectRepository(ClientLandingPage)
    private repo: Repository<ClientLandingPage>,
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
    dto: CreateClientLandingPageDto | UpdateClientLandingPageDto,
  ) {
    const clientId = await this.resolveClientId(param);
    if (clientId === null) throw new NotFoundException('Client not found for this tenant');

    let landing = await this.repo.findOne({ where: { client_id: clientId } });
    if (!landing) {
      landing = this.repo.create({ client_id: clientId, ...dto });
    } else {
      Object.assign(landing, dto);
    }
    return this.repo.save(landing);
  }
}

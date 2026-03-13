import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientSettings } from '../../shared/entities/client_settings.entity';
import { CreateClientSettingsDto } from './dto/create-client-settings.dto';
import { UpdateClientSettingsDto } from './dto/update-client-settings.dto';

@Injectable()
export class ClientSettingsService {
  constructor(
    @InjectRepository(ClientSettings)
    private repo: Repository<ClientSettings>,
  ) {}

  async getByClientId(client_id: number) {
    return this.repo.findOne({ where: { client_id } });
  }

  async createOrUpdate(
    client_id: number,
    dto: CreateClientSettingsDto | UpdateClientSettingsDto,
  ) {
    let settings = await this.repo.findOne({ where: { client_id } });

    if (!settings) {
      settings = this.repo.create({ client_id, ...dto });
    } else {
      Object.assign(settings, dto);
    }

    return this.repo.save(settings);
  }
}

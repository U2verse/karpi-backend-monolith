import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../shared/entities/client.entity';

@Injectable()
export class AdminBridgeService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async getClientDetails(clientId: number) {
    const client = await this.clientRepo.findOne({
      where: { client_id: clientId },
      relations: ['domains'],
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async changeClientStatus(
    clientId: number,
    newStatus: string,
    _reason?: string,
  ) {
    const client = await this.clientRepo.findOne({
      where: { client_id: clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    client.status = newStatus as any;
    return this.clientRepo.save(client);
  }
}

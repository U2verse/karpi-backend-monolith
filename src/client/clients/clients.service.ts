import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Client } from '../../shared/entities/client.entity';
import { Domain } from '../../shared/entities/domain.entity';
import { ClientInitializerService } from '../client-initializer/client-initializer.service';

import { ClientBrandingService } from '../client-branding/client-branding.service';
import { ClientProfileService } from '../client-profile/client-profile.service';
import { ClientUsageService } from '../client-usage/client-usage.service';
import { ClientSettingsService } from '../client-settings/client-settings.service';
import { ClientLandingPageService } from '../client_landing_page/client-landing-page.service';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepo: Repository<Client>,
    private clientInitializer: ClientInitializerService,
    private brandingService: ClientBrandingService,
    private profileService: ClientProfileService,
    private usageService: ClientUsageService,
    private settingsService: ClientSettingsService,
    private landingPageService: ClientLandingPageService,

    @InjectRepository(Domain)
    private domainsRepo: Repository<Domain>,
  ) {}

  // ---------------------------------------------------------
  // CREATE CLIENT + AUTO DOMAIN
  // ---------------------------------------------------------
  async create(dto: CreateClientDto) {
    // Normalize subdomain & custom domain
    if (dto.subdomain) {
      dto.subdomain = dto.subdomain.toLowerCase().trim();
    }
    if (dto.custom_domain) {
      dto.custom_domain = dto.custom_domain.toLowerCase().trim();
    }

    // 1️⃣ Name unique
    const existingName = await this.clientsRepo.findOne({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new BadRequestException('Client name already exists');
    }

    // 2️⃣ Subdomain unique (if used)
    if (dto.domain_type === 'subdomain') {
      const existingSub = await this.clientsRepo.findOne({
        where: { subdomain: dto.subdomain },
      });
      if (existingSub) {
        throw new BadRequestException('Subdomain already exists');
      }
    }

    // 3️⃣ Custom domain unique (if used)
    if (dto.domain_type === 'custom' && dto.custom_domain) {
      const existingCustom = await this.clientsRepo.findOne({
        where: { custom_domain: dto.custom_domain },
      });
      if (existingCustom) {
        throw new BadRequestException('Custom domain already exists');
      }
    }

    // 4️⃣ Create client
    const client = this.clientsRepo.create(dto);
    const savedClient = await this.clientsRepo.save(client);

    // 5️⃣ Build full domain string
    const fullDomain =
      dto.domain_type === 'subdomain'
        ? `${dto.subdomain}.karpiapp.com`
        : dto.custom_domain;

    const isSubdomain = dto.domain_type === 'subdomain';

    // 6️⃣ Create domain record (primary)
    const domain = this.domainsRepo.create({
      client_id: savedClient.client_id,
      domain: fullDomain,
      type: dto.domain_type,
      verified: isSubdomain, // subdomains auto verified
      verification_code: isSubdomain
        ? null
        : `karpi-verify-${randomBytes(4).toString('hex')}`,
      status: 'active',
      is_primary: true,
    });

    const savedDomain = await this.domainsRepo.save(domain);

    // 7️⃣ Sync primary_domain on client
    if (fullDomain) {
      savedClient.primary_domain = fullDomain;
      await this.clientsRepo.save(savedClient);
    }

    // 🔥 Auto-generate 5 default rows
    await this.clientInitializer.initialize(savedClient.client_id);

    return {
      message: 'Client created successfully',
      client: savedClient,
      primary_domain: fullDomain,
      domain: savedDomain,
    };
  }



  // ---------------------------------------------------------
  // GET ALL CLIENTS
  // ---------------------------------------------------------
  findAll() {
    return this.clientsRepo.find({
      relations: ['domains'],
    });
  }

  // ---------------------------------------------------------
  // GET ONE CLIENT
  // ---------------------------------------------------------
  async findOne(id: number) {
    const client = await this.clientsRepo.findOne({
      where: { client_id: id },
      relations: ['domains'],
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  // ---------------------------------------------------------
  // UPDATE CLIENT + DOMAIN
  // ---------------------------------------------------------
  async update(id: number, dto: UpdateClientDto) {
    const client = await this.findOne(id);

    // Optional: prevent subdomain editing in future
    if (dto.subdomain) {
      dto.subdomain = dto.subdomain.toLowerCase().trim();
    }

    Object.assign(client, dto);
    const savedClient = await this.clientsRepo.save(client);

    // If domain fields updated → update domain entry
    const domainRecord = await this.domainsRepo.findOne({
      where: { client_id: id },
    });

    if (domainRecord) {
      if (dto.subdomain) {
        domainRecord.domain = `${dto.subdomain}.karpiapp.com`;
      }
      if (dto.custom_domain) {
        domainRecord.domain = dto.custom_domain.toLowerCase();
      }
      if (dto.domain_type) {
        domainRecord.type = dto.domain_type;
      }

      await this.domainsRepo.save(domainRecord);
    }

    return {
      message: 'Client updated successfully',
      client: savedClient,
    };
  }

  // ---------------------------------------------------------
  // DELETE CLIENT (CASCADE)
  // ---------------------------------------------------------
  async remove(id: number) {
    const client = await this.findOne(id);
    await this.clientsRepo.remove(client);

    return { message: 'Client deleted successfully' };
  }

  async getClientOverview(client_id: number) {
    // base client
    const client = await this.clientsRepo.findOne({
      where: { client_id },
    });

    // if client doesn’t exist, return null (or throw, up to you)
    if (!client) {
      return null;
    }

    // parallel fetch all related data
    const [branding, profile, usage, settings, landing_page] =
      await Promise.all([
        this.brandingService.getByClientId(client_id),
        this.profileService.getByClientId(client_id),
        this.usageService.getByClientId(client_id),
        this.settingsService.getByClientId(client_id),
        this.landingPageService.getByClientId(client_id),
      ]);

    return {
      client,
      branding,
      profile,
      usage,
      settings,
      landing_page,
    };
  }
}



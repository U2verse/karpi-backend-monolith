import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Domain } from '../../shared/entities/domain.entity';
import { Client } from '../../shared/entities/client.entity';

import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';

import { randomBytes } from 'crypto';
import * as dns from 'dns/promises';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private readonly domainsRepo: Repository<Domain>,
    private readonly http: HttpService,
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
  ) {}

  // ============================================================================
  // CREATE DOMAIN
  // ============================================================================
  async create(dto: CreateDomainDto, userId: number) {
    // 1️⃣ Validate business rules
    this.validateDomainBusinessRules(dto.domain, dto.type);

    // 2️⃣ Unique domain check
    const exists = await this.domainsRepo.findOne({
      where: { domain: dto.domain },
    });

    if (exists) {
      throw new BadRequestException('Domain already exists');
    }

    // 3️⃣ Generate verification code (used in DNS TXT)
    const verificationCode = `karpi-verify-${randomBytes(4).toString('hex')}`;

    // 4️⃣ Create domain
    const domain = this.domainsRepo.create({
      ...dto,
      client_id: userId,
      verification_code: verificationCode,
      verified: false,
    });

    if (dto.type === 'custom') {
      const resolvable = await this.checkDomainResolvable(dto.domain);
      if (!resolvable) {
        throw new BadRequestException(
          'Domain does not resolve in DNS. Please configure DNS first.',
        );
      }
    }
    return this.domainsRepo.save(domain);
  }

  // ============================================================================
  // FIND ALL DOMAINS FOR LOGGED-IN USER
  // ============================================================================
  findAll(userId: number) {
    return this.domainsRepo.find({
      where: { client_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // ============================================================================
  // FIND ONE DOMAIN (TENANT SAFE)
  // ============================================================================
  async findOne(id: number, userId: number) {
    const domain = await this.domainsRepo.findOne({
      where: { domain_id: id, client_id: userId },
    });

    if (!domain) throw new NotFoundException('Domain not found');

    return domain;
  }

  // ============================================================================
  // UPDATE DOMAIN
  // ============================================================================
  async update(id: number, dto: UpdateDomainDto, userId: number) {
    const domain = await this.findOne(id, userId);

    // If domain/type changes → revalidate business rules
    if (dto.domain || dto.type) {
      this.validateDomainBusinessRules(
        dto.domain ?? domain.domain,
        dto.type ?? domain.type,
      );
    }

    Object.assign(domain, dto);
    return this.domainsRepo.save(domain);
  }

  // ============================================================================
  // DELETE DOMAIN
  // ============================================================================
  async remove(id: number, userId: number) {
    const domain = await this.findOne(id, userId);

    // ❌ Prevent deleting primary domain
    if (domain.is_primary) {
      throw new BadRequestException(
        'You cannot delete the primary domain. Switch primary domain first.'
      );
    }

    return this.domainsRepo.remove(domain);
  }

  async regenerateVerificationCode(id: number, userId: number) {
    const domain = await this.findOne(id, userId);

    if (domain.type !== 'custom') {
      throw new BadRequestException('Only custom domains use verification codes');
    }

    const newCode = `karpi-verify-${randomBytes(4).toString('hex')}`;
    domain.verification_code = newCode;
    domain.verified = false;

    await this.domainsRepo.save(domain);

    return { new_code: newCode };
  }

  // ============================================================================
  // DOMAIN BUSINESS RULE VALIDATIONS
  // ============================================================================
  private validateDomainBusinessRules(domain: string, type: string) {
    // RULE 1 — Must not include protocol
    if (domain.includes('http://') || domain.includes('https://')) {
      throw new BadRequestException(
        'Domain must not contain protocol (http:// or https://)',
      );
    }

    // RULE 2 — No spaces
    if (domain.includes(' ')) {
      throw new BadRequestException('Domain cannot contain spaces');
    }

    // RULE 3 — No double dots
    if (domain.includes('..')) {
      throw new BadRequestException('Domain cannot contain consecutive dots (..)');
    }

    // RULE 4 — Platform root cannot be used
    if (domain === 'karpiapp.com') {
      throw new BadRequestException('karpiapp.com cannot be used as a tenant domain');
    }

    // RULE 5 — Type-specific validations
    if (type === 'subdomain') {
      if (!domain.endsWith('.karpiapp.com')) {
        throw new BadRequestException(
          'Subdomain must end with ".karpiapp.com"',
        );
      }
    }

    if (type === 'custom') {
      if (domain.endsWith('.karpiapp.com')) {
        throw new BadRequestException(
          'Custom domain cannot be a subdomain of karpiapp.com',
        );
      }
    }

    // RULE 6 — Must include at least 1 dot
    if (!domain.includes('.')) {
      throw new BadRequestException(
        'Domain must include at least one dot (e.g., example.com)',
      );
    }
  }

  // ============================================================================
  // VERIFY DOMAIN NOW (DNS TXT CHECK)
  // ============================================================================
  async verifyDomain(domainId: number, userId: number) {
    const domain = await this.findOne(domainId, userId);

    if (domain.type !== 'custom') {
      throw new BadRequestException('Only custom domains need verification');
    }

    if (!domain.verification_code) {
      throw new BadRequestException('Verification code missing');
    }

    try {
      const records = await dns.resolveTxt(domain.domain);
      const flatRecords = records.flat().join(' ');

      if (flatRecords.includes(domain.verification_code)) {
        domain.verified = true;
        await this.domainsRepo.save(domain);

        // 🔔 Notify infra service to provision Nginx + SSL for custom domain (fire and forget)
        // INFRA_WEBHOOK_URL points to a separate infra server (NOT this backend).
        // Leave unset until you build the infra provisioning service.
        if (process.env.INFRA_WEBHOOK_URL) {
          const payload = {
            domain: domain.domain,
            client_id: domain.client_id,
            type: domain.type,
          };
          try {
            await firstValueFrom(
              this.http.post(process.env.INFRA_WEBHOOK_URL, payload),
            );
          } catch (err) {
            console.error('Infra webhook failed:', err?.message);
          }
        }

        return {
          verified: true,
          message: 'Domain successfully verified!',
        };
      }

      return {
        verified: false,
        message: 'TXT record not found. Add the DNS TXT entry and retry.',
      };
    } catch (err) {
      return {
        verified: false,
        message:
          'Unable to fetch DNS records. DNS may not have propagated yet.',
      };
    }
  }

  // ============================================================================
  // SET PRIMARY DOMAIN
  // ============================================================================
  async setPrimaryDomain(domainId: number, userId: number) {

    // 1. Find the domain for this tenant
    const domain = await this.domainsRepo.findOne({
      where: { domain_id: domainId, client_id: userId },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    if (!domain.verified) {
      throw new BadRequestException('Cannot make an unverified domain primary');
    }

    // 2. Clear old primary
    await this.domainsRepo.update(
      { client_id: userId, is_primary: true },
      { is_primary: false },
    );

    // 3. Set this as primary
    domain.is_primary = true;
    await this.domainsRepo.save(domain);

    // 4. ⭐ Sync client.primary_domain
    await this.clientsRepo.update(
      { client_id: domain.client_id },
      { primary_domain: domain.domain },
    );

    return {
      message: 'Primary domain updated successfully',
      primary_domain: domain.domain,
    };
  }

  async getPrimaryDomain(userId: number) {
    const domain = await this.domainsRepo.findOne({
      where: { client_id: userId, is_primary: true },
    });

    return domain || { message: 'No primary domain found' };
  }

  async reverify(domainId: number, userId: number) {
    return this.verifyDomain(domainId, userId); // reuse existing verification function
  }

  private async checkDomainResolvable(domain: string): Promise<boolean> {
    try {
      // Try A + CNAME records
      await dns.resolveAny(domain);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // CHECK SUBDOMAIN AVAILABILITY (PUBLIC)
  // ============================================================================
  async checkSubdomainAvailability(subdomain: string) {
    if (!subdomain) {
      return { available: false };
    }

    const normalized = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    const fullDomain = `${normalized}.karpiapp.com`;

    try {
      const existing = await this.domainsRepo.findOne({
        where: {
          domain: fullDomain,
          type: 'subdomain',
          status: 'active',
        },
      });

      return {
        available: !existing,
        domain: fullDomain,
      };
    } catch (e) {
      console.error('checkSubdomainAvailability DB error:', e?.message);
      return { available: true, domain: fullDomain };
    }
  }

  // ============================================================================
  // RESOLVE TENANT BY SUBDOMAIN SLUG (PUBLIC — used by student app middleware)
  // ============================================================================
  async resolveTenant(slug: string) {
    const normalized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const fullDomain = `${normalized}.karpiapp.com`;

    const domain = await this.domainsRepo.findOne({
      where: { domain: fullDomain, type: 'subdomain', status: 'active' },
    });

    if (!domain) {
      throw new NotFoundException(`No academy found for subdomain "${normalized}"`);
    }

    const client = await this.clientsRepo.findOne({
      where: { client_id: domain.client_id },
      select: ['client_id', 'tenant_id', 'name', 'status'],
    });

    if (!client || client.status !== 'active') {
      throw new NotFoundException(`Academy "${normalized}" is not active`);
    }

    return {
      client_id: client.client_id,
      tenant_id: client.tenant_id,
      name: client.name,
      subdomain: normalized,
      domain: fullDomain,
    };
  }
}
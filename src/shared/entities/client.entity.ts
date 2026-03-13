// src/clients/entities/client.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Domain } from './domain.entity';
import { ClientBranding } from './client_branding.entity';
import { ClientProfile } from './client_profile.entity';
import { ClientSettings } from './client_settings.entity';
import { ClientUsage } from './client_usage.entity';

export type ClientDomainType = 'subdomain' | 'custom';
export type ClientStatus = 'active' | 'inactive' | 'suspended';

@Entity('clients')
export class Client {
  // 🔑 Internal relational PK
  @PrimaryGeneratedColumn()
  client_id: number;

  // 🔑 Global tenant identity (AUTH / JWT / GATEWAY)
  @Column({
    type: 'uuid',
    unique: true,
    default: () => 'uuid_generate_v4()',
  })
  tenant_id: string;

  @Column({ length: 255, unique: true })
  name: string;

  @Column({ length: 255, unique: true })
  subdomain: string;

  @Column({ length: 255, nullable: true })
  custom_domain?: string;

  @Column({
    type: 'enum',
    enum: ['subdomain', 'custom'],
  })
  domain_type: ClientDomainType;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: ClientStatus;

  @Column({ length: 50, nullable: true })
  plan?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  hosting_provider_name?: string;

  @Column({ type: 'date', nullable: true })
  custom_domain_expiry_date?: Date;

  @Column({ length: 255, nullable: true })
  primary_domain?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ================= RELATIONS =================

  @OneToMany(() => Domain, (domain) => domain.client)
  domains: Domain[];

  @OneToMany(() => ClientBranding, (branding) => branding.client)
  branding: ClientBranding[];

  @OneToMany(() => ClientProfile, (profile) => profile.client)
  profile: ClientProfile[];

  @OneToMany(() => ClientSettings, (settings) => settings.client)
  settings: ClientSettings[];

  @OneToMany(() => ClientUsage, (usage) => usage.client)
  usage: ClientUsage[];
}

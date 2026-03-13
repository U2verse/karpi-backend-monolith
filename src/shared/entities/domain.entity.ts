import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Client } from './client.entity';

export type DomainType = 'subdomain' | 'custom';
export type DomainStatus = 'active' | 'inactive';

@Entity('domains')
export class Domain {
  @PrimaryGeneratedColumn()
  domain_id: number;

  @ManyToOne(() => Client, (client) => client.domains, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })    // 🔥 FIX
  client: Client;

  @Column()
  client_id: number; // FK

  @Column({ length: 255, unique: true })
  domain: string;

  @Column({
    type: 'enum',
    enum: ['subdomain', 'custom'],
  })
  type: DomainType;

  @Column({ type: 'text', nullable: true })
  verification_code: string | null;

  @Column({ default: false })
  verified: boolean;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: DomainStatus;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Client } from './client.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

@Entity('client_branding')
export class ClientBranding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  client_id!: number;

  @ManyToOne(() => Client, (client) => client.branding, { onDelete: 'CASCADE' })
  
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'text', nullable: true })
  logo_url?: string;

  @Column({ type: 'text', nullable: true })
  banner_url?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  theme_color?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  primary_color?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  secondary_color?: string;

  @Column({
    type: 'enum',
    enum: ['light', 'dark'],
    nullable: true,
  })
  theme_mode?: 'light' | 'dark';

  @Column({ type: 'varchar', length: 50, nullable: true })
  font_family?: string;

  @UpdateDateColumn()
  updated_at!: Date;
}

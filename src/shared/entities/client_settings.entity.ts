import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

@Entity('client_settings')
export class ClientSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  client_id!: number;

  @ManyToOne(() => Client, (client) => client.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "client_id" })
  client: Client;

  @Column({ type: 'boolean', default: true })
  enable_chat!: boolean;

  @Column({ type: 'boolean', default: true })
  enable_notifications!: boolean;

  @Column({ type: 'boolean', default: true })
  enable_payment!: boolean;

  @Column({ type: 'boolean', default: true })
  enable_landing_page!: boolean;

  @Column({ type: 'boolean', default: false })
  certificate_auto_generate!: boolean;

  @Column({
    type: 'enum',
    enum: ['en', 'ta', 'te', 'hi'],
    default: 'en',
  })
  language!: 'en' | 'ta' | 'te' | 'hi';

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'Asia/Kolkata' })
  timezone?: string;

  @UpdateDateColumn()
  updated_at!: Date;
}

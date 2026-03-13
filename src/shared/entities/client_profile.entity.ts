import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

@Entity('client_profile')
export class ClientProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  client_id!: number;

  @ManyToOne(() => Client, (client) => client.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "client_id" })
  client: Client;

  @Column({ type: 'varchar', length: 255 })
  academy_name!: string;

  @Column({ type: 'varchar', length: 255 })
  owner_name!: string;

  @Column({ type: 'varchar', length: 255 })
  contact_email!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'json', nullable: true })
  services?: any;

  @UpdateDateColumn()
  updated_at!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

@Entity('client_usage')
export class ClientUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  client_id!: number;

  @ManyToOne(() => Client, (client) => client.usage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "client_id" })
  client: Client;

  @Column({ type: 'int' })
  total_storage_used_mb!: number;

  @Column({ type: 'int' })
  storage_limit_mb!: number;

  @Column({ type: 'int' })
  students_used!: number;

  @Column({ type: 'int' })
  students_limit!: number;

  @Column({ type: 'int' })
  courses_used!: number;

  @Column({ type: 'int' })
  courses_limit!: number;

  @Column({ type: 'int' })
  videos_used!: number;

  @Column({ type: 'int' })
  videos_limit!: number;

  @Column({ type: 'int' })
  assignments_used!: number;

  @Column({ type: 'int' })
  assignments_limit!: number;

  @Column({ type: 'timestamp', nullable: true })
  last_reset_at?: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('client_usage_history')
export class ClientUsageHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column()
  month: string; // '2025-01'

  @Column('int')
  storage_used_mb: number;

  @Column('int')
  students_used: number;

  @Column('int')
  videos_used: number;

  @Column('int')
  courses_used: number;

  @CreateDateColumn()
  generated_at: Date;
}

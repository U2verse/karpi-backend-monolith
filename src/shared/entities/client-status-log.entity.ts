import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('client_status_logs')
export class ClientStatusLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column()
  previous_status: string;

  @Column()
  new_status: string;

  @Column()
  changed_by: number; // super admin user id

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  created_at: Date;
}

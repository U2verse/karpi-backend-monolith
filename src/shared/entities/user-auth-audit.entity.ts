import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_auth_audit')
export class UserAuthAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  user_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  tenant_id!: string | null;

  @Column({ type: 'varchar' })
  action!: string;

  @Column({ type: 'varchar', nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', nullable: true })
  user_agent!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details!: any | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}

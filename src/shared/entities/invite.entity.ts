import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'varchar' })
  client_name: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  whatsapp: string | null;

  @Column({ nullable: true, type: 'int' })
  plan_id: number | null;

  @Column({ type: 'varchar', nullable: true })
  plan_name: string | null;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ nullable: true, type: 'timestamp' })
  used_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}

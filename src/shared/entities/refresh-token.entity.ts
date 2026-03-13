import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Student } from './student.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // NULL for student tokens
  @Column({ type: 'uuid', nullable: true })
  user_id!: string | null;

  // NULL for user tokens
  @Column({ type: 'uuid', nullable: true })
  student_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  tenant_id!: string | null;

  @Column({ type: 'text' })
  token_hash!: string;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ type: 'boolean', default: false })
  revoked!: boolean;

  @Column({ type: 'varchar', nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', nullable: true })
  user_agent!: string | null;

  @Column({ type: 'varchar', length: 64 })
  token_fingerprint!: string;

  @ManyToOne(() => User, (u) => u.refreshTokens, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student | null;
}

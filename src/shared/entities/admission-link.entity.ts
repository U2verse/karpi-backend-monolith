import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AdmissionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('admission_links')
@Index(['tenant_id'])
@Index(['token'], { unique: true })
export class AdmissionLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column()
  student_email: string;

  @Column({ nullable: true })
  student_name?: string;

  @Column({ nullable: true, type: 'uuid' })
  course_id?: string;

  @Column({ nullable: true })
  course_name?: string;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Column()
  token: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({
    type: 'enum',
    enum: AdmissionStatus,
    default: AdmissionStatus.PENDING,
  })
  status: AdmissionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;
}

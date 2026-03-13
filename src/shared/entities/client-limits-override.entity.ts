import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('client_limits_override')
export class ClientLimitsOverride {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column({ type: 'int', nullable: true })
  override_storage_mb: number | null;

  @Column({ type: 'int', nullable: true })
  override_students: number | null;

  @Column({ type: 'int', nullable: true })
  override_courses: number | null;

  @Column({ type: 'int', nullable: true })
  override_videos: number | null;

  @Column({ type: 'int', nullable: true })
  override_assignments: number | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @UpdateDateColumn()
  updated_at: Date;
}

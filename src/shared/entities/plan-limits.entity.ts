import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Plan } from './plan.entity';

@Entity('plan_limits')
export class PlanLimits {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plan_id: number;

  @OneToOne(() => Plan, (plan) => plan.limits)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  // NULL = unlimited
  @Column({ type: 'int', nullable: true })
  storage_mb: number | null;

  @Column({ type: 'int', nullable: true })
  student_limit: number | null;

  @Column({ type: 'int', nullable: true })
  course_limit: number | null;

  @Column({ type: 'int', nullable: true })
  video_limit: number | null;

  @Column({ type: 'int', nullable: true })
  assignment_limit: number | null;

  @Column({ type: 'int', nullable: true })
  materials_per_course: number | null;

  @Column({ type: 'int', nullable: true })
  admin_logins: number | null;
}

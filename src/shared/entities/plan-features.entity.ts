import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Plan } from './plan.entity';

@Entity('plan_features')
export class PlanFeatures {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plan_id: number;

  @OneToOne(() => Plan, (plan) => plan.features)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ default: true })
  student_app_access: boolean;

  // "Yes" | "Yes (Advanced)" | null
  @Column({ type: 'varchar', nullable: true })
  certificates: string | null;

  @Column({ default: false })
  custom_domain: boolean;

  @Column({ default: true })
  subdomain: boolean;

  // "basic" | "advanced" | "white_label"
  @Column({ type: 'varchar', nullable: true })
  analytics: string | null;

  // "basic" | "advanced_themes" | "white_label"
  @Column({ type: 'varchar', nullable: true })
  branding: string | null;

  // "basic" | "business_hours" | "priority"
  @Column({ type: 'varchar', nullable: true })
  support_level: string | null;
}

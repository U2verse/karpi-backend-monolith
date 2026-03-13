import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { PlanLimits } from './plan-limits.entity';
import { PlanFeatures } from './plan-features.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  feature_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  meaning: string | null;

  @Column({ type: 'decimal' })
  price_monthly: number;

  @Column({ type: 'decimal', nullable: true })
  price_yearly: number | null;

  @Column({ type: 'varchar', nullable: true })
  save_percentage: string | null;

  @Column({ default: false })
  best_pick: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => PlanLimits, (limits) => limits.plan, { cascade: true, eager: false })
  limits: PlanLimits;

  @OneToOne(() => PlanFeatures, (features) => features.plan, { cascade: true, eager: false })
  features: PlanFeatures;
}

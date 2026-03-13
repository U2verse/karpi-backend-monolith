import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Plan } from './plan.entity';

@Entity('client_plan_subscriptions')
export class ClientPlanSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column()
  plan_id: number;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: ['monthly', 'yearly'] })
  renew_type: 'monthly' | 'yearly';

  @Column({ default: true })
  active: boolean;

  // 🟩 FIX: Add correct type
  @Column({ type: 'int', nullable: true })
  upgraded_from: number | null;

  @CreateDateColumn()
  created_at: Date;
}

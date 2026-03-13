import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ClientPlanSubscription } from './client-plan-subscription.entity';

export type BillingStatus = 'paid' | 'pending' | 'failed';

@Entity('billing')
export class Billing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column()
  subscription_id: number;

  @ManyToOne(() => ClientPlanSubscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: ClientPlanSubscription;

  @Column('decimal')
  amount: number;

  @Column({ type: 'enum', enum: ['paid', 'pending', 'failed'] })
  status: BillingStatus;

  @Column({ type: 'varchar', nullable: true })
  transaction_id: string | null;

  @Column({ type: 'text', nullable: true })
  invoice_url: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paid_on: Date | null;

  @CreateDateColumn()
  created_at: Date;
}

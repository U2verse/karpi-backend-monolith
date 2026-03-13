import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('client_landing_page')
export class ClientLandingPage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  client_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  headline?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  about_section?: string;

  @Column({ type: 'json', nullable: true })
  testimonials?: any;

  @Column({ type: 'json', nullable: true })
  achievements?: any;

  @Column({ type: 'json', nullable: true })
  courses_preview?: any;

  @UpdateDateColumn()
  updated_at!: Date;
}

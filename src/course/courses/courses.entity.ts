import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CourseStatus } from './course-status.enum';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnail_url: string;

 /*  @Column({
    type: 'varchar',
    default: 'draft', // draft | published | archived
  })
  status: string; */

  @Column({ nullable: true })
  level: string; // beginner | intermediate | advanced

  @Column({ nullable: true })
  language: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number; // discount percentage e.g. 10 = 10%

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    insert: false,
    update: false,
    nullable: true,
  })
  discounted_price: number;

  @Column({ type: 'uuid' })
  created_by: string; // admin / teacher user_id

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('lesson_progress')
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'uuid' })
  lesson_id: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({
    type: 'varchar',
    default: 'NOT_STARTED',
  })
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

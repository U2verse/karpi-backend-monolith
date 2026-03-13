import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

@Entity('student_course_points')
export class StudentCoursePoints {
  @PrimaryGeneratedColumn('uuid')
  points_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @Column({ type: 'int', default: 0 })
  points_from_assignments: number;

  @Column({ type: 'int', default: 0 })
  points_from_progress: number;

  @Column({ type: 'int', default: 0 })
  total_points: number;

  @Column({ type: 'int', default: 0 })
  levels: number;

  @Column({ type: 'text', nullable: true })
  awards: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;
}

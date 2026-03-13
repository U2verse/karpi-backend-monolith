import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

@Entity('student_enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  enrollment_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @Column({ type: 'date', nullable: true })
  course_start_date: string | null;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    enumName: 'student_enrollment_status_enum',
    default: EnrollmentStatus.ACTIVE,
  })
  status: EnrollmentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  enrolled_at: Date;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;
}

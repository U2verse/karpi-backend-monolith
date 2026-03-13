import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('lessons')
@Index(['tenant_id', 'course_id'])
@Index(['module_id'])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  module_id: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @Column()
  title: string;

  @Column({
    type: 'varchar',
    default: 'video', // video | text | quiz | assignment
  })
  type: string;

    // 🔥 THIS IS THE IMPORTANT PART
  @Column({ type: 'uuid', nullable: true })
  video_id?: string;

  @Column({ nullable: true })
  video_url: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VideoStatus, VideoVisibility } from './video.enums';

@Entity('videos')
@Index(['tenant_id'])
@Index(['course_id'])
@Index(['lesson_id'])
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid', { nullable: true })
  course_id?: string;

  @Column('uuid', { nullable: true })
  lesson_id?: string | null;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('uuid')
  uploaded_by: string;

  @Column('text', { nullable: true })
  source_filename?: string;

  @Column('text')
  s3_key_prefix: string;

  @Column('int', { default: 0 })
  duration_seconds: number;

  @Column({
    type: 'enum',
    enum: VideoStatus,
    default: VideoStatus.UPLOADED,
  })
  status: VideoStatus;

  @Column('bigint', { default: 0 })
  size_bytes: number;

  @Column({
    type: 'enum',
    enum: VideoVisibility,
    default: VideoVisibility.PRIVATE,
  })
  visibility: VideoVisibility;

  @Column('uuid', { nullable: true })
  default_variant_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

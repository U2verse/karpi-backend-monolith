import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('video_variants')
@Index(['video_id'])
export class VideoVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  video_id: string;

  @ManyToOne(() => Video, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column('text')
  variant_label: string;

  @Column('text')
  s3_key: string;

  @Column('text')
  mime_type: string;

  @Column('int', { nullable: true })
  width?: number;

  @Column('int', { nullable: true })
  height?: number;

  @Column('int', { nullable: true })
  bitrate_kbps?: number;

  @Column('bigint', { nullable: true })
  size_bytes?: number;

  @Column('text', { nullable: true })
  codec?: string;

  @CreateDateColumn()
  created_at: Date;
}

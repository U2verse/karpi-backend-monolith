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

@Entity('video_captions')
@Index(['video_id', 'language_code'], { unique: true })
export class VideoCaption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  video_id: string;

  @ManyToOne(() => Video, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ length: 8 })
  language_code: string;

  @Column('text')
  s3_key: string;

  @Column('text')
  format: string;

  @CreateDateColumn()
  created_at: Date;
}

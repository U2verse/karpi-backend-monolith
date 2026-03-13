import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('video_analytics_events')
@Index(['video_id'])
@Index(['tenant_id'])
export class VideoAnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  video_id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid', { nullable: true })
  user_id?: string;

  @Column('text')
  event_type: string;

  @Column('int', { nullable: true })
  position_seconds?: number;

  @CreateDateColumn()
  created_at: Date;
}

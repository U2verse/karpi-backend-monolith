import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoAnalyticsEvent } from './entities/video-analytics.entity';

@Injectable()
export class VideoAnalyticsProducer {
  constructor(
    @InjectRepository(VideoAnalyticsEvent)
    private readonly analyticsRepo: Repository<VideoAnalyticsEvent>,
  ) {}

  emitEvent(payload: {
    tenant_id: string;
    video_id: string;
    user_id?: string;
    event_type: string;
    position_seconds?: number;
  }) {
    // Fire-and-forget: persist analytics event directly to DB
    this.analyticsRepo.save(this.analyticsRepo.create(payload)).catch(() => {});
  }
}

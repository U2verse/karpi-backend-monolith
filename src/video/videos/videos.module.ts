import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosController } from './videos.controller';
import { Video } from './entities/video.entity';
import { VideoVariant } from './entities/video-variant.entity';
import { VideoThumbnail } from './entities/video-thumbnail.entity';
import { VideoCaption } from './entities/video-caption.entity';
import { VideoAnalyticsEvent } from './entities/video-analytics.entity';
import { TenantStorage } from './entities/tenant-storage.entity';
import { VideosService } from './videos.service';
import { VideoPlaybackService } from './videos.playback';
import { VideoAnalyticsProducer } from './video-analytics.producer';
import { S3Service } from './s3.service';
import { VideoCleanupService } from './video-cleanup.service';
import { Lesson } from '../../course/lessons/lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Video,
      VideoVariant,
      VideoThumbnail,
      VideoCaption,
      VideoAnalyticsEvent,
      TenantStorage,
      Lesson,
    ]),
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoPlaybackService, VideoAnalyticsProducer, S3Service, VideoCleanupService],
})
export class VideosModule {}

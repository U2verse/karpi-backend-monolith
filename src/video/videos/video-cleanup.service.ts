import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Video } from './entities/video.entity';
import { VideoStatus } from './entities/video.enums';
import { S3Service } from './s3.service';

@Injectable()
export class VideoCleanupService {
  constructor(
    @InjectRepository(Video)
    private readonly repo: Repository<Video>,
    private readonly s3: S3Service,
  ) {}

  async cleanupArchivedVideos(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const oldVideos = await this.repo.find({
      where: {
        status: VideoStatus.ARCHIVED,
        updated_at: LessThan(cutoff),
      },
    });

    for (const video of oldVideos) {
      await this.s3.deleteObject(video.s3_key_prefix + '.mp4');
      await this.repo.delete(video.id);
    }

    return { deleted: oldVideos.length };
  }
}

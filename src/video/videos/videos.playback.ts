import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';

@Injectable()
export class VideoPlaybackService {
  constructor(private readonly s3Service: S3Service) {}

  async getSignedPlaybackUrl(s3Key: string) {
    const url = await this.s3Service.getPreviewUrl(s3Key);
    return {
      playback_url: url,
      expires_in: 600,
    };
  }
}

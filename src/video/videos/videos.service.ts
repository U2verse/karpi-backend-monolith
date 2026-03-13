import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Video } from './entities/video.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateThumbnailDto } from './dto/create-thumbnail.dto';
import { CreateCaptionDto } from './dto/create-caption.dto';

import { VideoVariant } from './entities/video-variant.entity';
import { VideoThumbnail } from './entities/video-thumbnail.entity';
import { VideoCaption } from './entities/video-caption.entity';
import { TenantStorage } from './entities/tenant-storage.entity';
import { VideoStatus } from './entities/video.enums';
import { S3Service } from './s3.service';
import { Lesson } from '../../course/lessons/lesson.entity';

type CreateVideoInternal = CreateVideoDto & {
  tenant_id: string;
  uploaded_by: string;
};

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    private readonly s3Service: S3Service,
    @InjectRepository(VideoVariant) private readonly variantRepo: Repository<VideoVariant>,
    @InjectRepository(VideoThumbnail) private readonly thumbRepo: Repository<VideoThumbnail>,
    @InjectRepository(VideoCaption) private readonly captionRepo: Repository<VideoCaption>,
    @InjectRepository(TenantStorage)
    private readonly storageRepo: Repository<TenantStorage>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
  ) {}

  async create(data: CreateVideoInternal) {
    const video = this.videoRepo.create({
      ...data,
      status: VideoStatus.UPLOADED,
    });

    const saved = await this.videoRepo.save(video);

    // Keep lessons.video_id in sync
    if (data.lesson_id) {
      await this.lessonRepo.update(
        { id: data.lesson_id, tenant_id: data.tenant_id },
        { video_id: saved.id },
      );
    }

    return saved;
  }

  async findByCourse(tenant_id: string, course_id: string) {
    return this.videoRepo.find({
      where: { tenant_id, course_id },
      order: { created_at: 'ASC' },
    });
  }

  async findOne(tenant_id: string, id: string) {
    return this.videoRepo.findOne({
      where: { id, tenant_id },
    });
  }

  async update(tenant_id: string, id: string, dto: UpdateVideoDto) {
    const video = await this.findOne(tenant_id, id);
    if (!video) throw new NotFoundException('Video not found');

    Object.assign(video, dto);
    return this.videoRepo.save(video);
  }

  async remove(tenant_id: string, id: string) {
    const video = await this.findOne(tenant_id, id);
    if (!video) throw new NotFoundException('Video not found');

    await this.videoRepo.remove(video);
    return { deleted: true };
  }

  // ---------- VARIANTS ----------
  async addVariant(tenant_id: string, dto: CreateVariantDto) {
    await this.assertVideoTenant(tenant_id, dto.video_id);

    const variant = await this.variantRepo.save(
      this.variantRepo.create(dto),
    );

    await this.increaseTenantStorage(
      tenant_id,
      dto.size_bytes ?? 0,
    );

    return variant;
  }

  async listVariants(tenant_id: string, video_id: string) {
    await this.assertVideoTenant(tenant_id, video_id);
    return this.variantRepo.find({ where: { video_id } });
  }

  async deleteVariant(tenant_id: string, id: string) {
    const v = await this.variantRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Variant not found');

    await this.assertVideoTenant(tenant_id, v.video_id);

    await this.variantRepo.remove(v);

    await this.decreaseTenantStorage(
      tenant_id,
      v.size_bytes ?? 0,
    );

    return { deleted: true };
  }


  // ---------- THUMBNAILS ----------
  async addThumbnail(tenant_id: string, dto: CreateThumbnailDto) {
    await this.assertVideoTenant(tenant_id, dto.video_id);

    if (dto.is_default) {
      await this.thumbRepo.update(
        { video_id: dto.video_id },
        { is_default: false },
      );
    }

    return this.thumbRepo.save(this.thumbRepo.create(dto));
  }

  async listThumbnails(tenant_id: string, video_id: string) {
    await this.assertVideoTenant(tenant_id, video_id);
    return this.thumbRepo.find({ where: { video_id }, order: { is_default: 'DESC' } });
  }

  async deleteThumbnail(tenant_id: string, id: string) {
    const t = await this.thumbRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Thumbnail not found');
    await this.assertVideoTenant(tenant_id, t.video_id);
    await this.thumbRepo.remove(t);
    return { deleted: true };
  }

  // ---------- CAPTIONS ----------
  async addCaption(tenant_id: string, dto: CreateCaptionDto) {
    await this.assertVideoTenant(tenant_id, dto.video_id);
    return this.captionRepo.save(this.captionRepo.create(dto));
  }

  async listCaptions(tenant_id: string, video_id: string) {
    await this.assertVideoTenant(tenant_id, video_id);
    return this.captionRepo.find({ where: { video_id } });
  }

  async deleteCaption(tenant_id: string, id: string) {
    const c = await this.captionRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Caption not found');
    await this.assertVideoTenant(tenant_id, c.video_id);
    await this.captionRepo.remove(c);
    return { deleted: true };
  }

  // ---------- helper ----------
  private async assertVideoTenant(tenant_id: string, video_id: string) {
    const v = await this.videoRepo.findOne({ where: { id: video_id, tenant_id } });
    if (!v) throw new NotFoundException('Video not found');
  }

  // -----------------------------
  // STORAGE ACCOUNTING HELPERS
  // -----------------------------

  private async increaseTenantStorage(tenant_id: string, bytes: number) {
    if (!bytes || bytes <= 0) return;

    await this.storageRepo.query(
      `
      INSERT INTO tenant_storage (tenant_id, storage_used_bytes, last_updated)
      VALUES ($1, $2, now())
      ON CONFLICT (tenant_id)
      DO UPDATE
      SET storage_used_bytes = tenant_storage.storage_used_bytes + EXCLUDED.storage_used_bytes,
          last_updated = now()
      `,
      [tenant_id, bytes],
    );
  }


  private async decreaseTenantStorage(tenant_id: string, bytes: number) {
    if (!bytes || bytes <= 0) return;

    await this.storageRepo.query(
      `
      UPDATE tenant_storage
      SET storage_used_bytes = GREATEST(storage_used_bytes - $1, 0),
          last_updated = now()
      WHERE tenant_id = $2
      `,
      [bytes, tenant_id],
    );
  }

  async getTenantStorage(tenant_id: string) {
    return this.storageRepo.findOne({
      where: { tenant_id },
    });
  }

    async getPreviewUrl(videoId: string, tenantId: string) {
    const video = await this.videoRepo.findOne({
      where: { id: videoId, tenant_id: tenantId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // IMPORTANT: use full key
    const s3Key = `${video.s3_key_prefix}.mp4`;

    const previewUrl = await this.s3Service.getPreviewUrl(s3Key);

    return {
      video_id: video.id,
      preview_url: previewUrl,
      expires_in: 600,
    };
  }

  async getStudentPlaybackUrl(
    videoId: string,
    tenantId: string,
    studentId: string,
  ) {
    const video = await this.videoRepo.findOne({
      where: { id: videoId, tenant_id: tenantId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // (Optional later) check enrollment via course-service

    const s3Key = `${video.s3_key_prefix}.mp4`;

    const signedUrl = await this.s3Service.getPreviewUrl(s3Key);

    return {
      video_id: video.id,
      play_url: signedUrl,
      expires_in: 600,
    };
  }

  async markReplaced(videoId: string, tenantId: string) {
    const video = await this.videoRepo.findOne({
      where: { id: videoId, tenant_id: tenantId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    video.status = VideoStatus.REPLACED;
    return this.videoRepo.save(video);
  }

}

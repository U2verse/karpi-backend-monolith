import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';

import { VideosService } from './videos.service';
import { VideoPlaybackService } from './videos.playback';
import { VideoAnalyticsProducer } from './video-analytics.producer';
import { S3Service } from './s3.service';

import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateThumbnailDto } from './dto/create-thumbnail.dto';
import { CreateCaptionDto } from './dto/create-caption.dto';

@Controller('videos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly playbackService: VideoPlaybackService,
    private readonly analyticsProducer: VideoAnalyticsProducer,
    private readonly s3Service: S3Service,
  ) {}

  // -----------------------------
  // STATIC ROUTES (before :id)
  // -----------------------------

  @Get('storage/usage')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  getStorageUsage(@Req() req: any) {
    return this.videosService.getTenantStorage(req.user.tenant_id);
  }

  @Post('upload-url')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  getUploadUrl(
    @Req() req: any,
    @Body() body: { course_id: string; filename: string; contentType: string },
  ) {
    return this.s3Service.getUploadUrl({
      tenantId: req.user.tenant_id,
      courseId: body.course_id,
      filename: body.filename,
      contentType: body.contentType,
    });
  }

  @Get('admin/:videoId/preview')
  @Roles(Role.CLIENTADMIN, Role.SUPERADMIN)
  previewVideo(@Param('videoId') videoId: string, @Req() req: any) {
    return this.videosService.getPreviewUrl(videoId, req.user.tenant_id);
  }

  @Post('admin/:videoId/mark-replaced')
  @Roles(Role.CLIENTADMIN, Role.SUPERADMIN)
  markReplaced(@Param('videoId') videoId: string, @Req() req: any) {
    return this.videosService.markReplaced(videoId, req.user.tenant_id);
  }

  @Get('student/:videoId/play')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  playVideo(@Param('videoId') videoId: string, @Req() req: any) {
    return this.videosService.getStudentPlaybackUrl(
      videoId,
      req.user.tenant_id,
      req.user.user_id,
    );
  }

  @Get('course/:courseId')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  findByCourse(@Req() req: any, @Param('courseId') courseId: string) {
    return this.videosService.findByCourse(req.user.tenant_id, courseId);
  }

  // ---------- VARIANTS (static delete before :id) ----------
  @Delete('variants/:variantId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  deleteVariant(@Req() req: any, @Param('variantId') variantId: string) {
    return this.videosService.deleteVariant(req.user.tenant_id, variantId);
  }

  // ---------- THUMBNAILS (static delete before :id) ----------
  @Delete('thumbnails/:thumbId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  deleteThumbnail(@Req() req: any, @Param('thumbId') thumbId: string) {
    return this.videosService.deleteThumbnail(req.user.tenant_id, thumbId);
  }

  // ---------- CAPTIONS (static delete before :id) ----------
  @Delete('captions/:captionId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  deleteCaption(@Req() req: any, @Param('captionId') captionId: string) {
    return this.videosService.deleteCaption(req.user.tenant_id, captionId);
  }

  // -----------------------------
  // ADMIN / CLIENT ADMIN CRUD
  // -----------------------------

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  createVideo(@Body() dto: CreateVideoDto, @Req() req: any) {
    return this.videosService.create({
      ...dto,
      tenant_id: req.user.tenant_id,
      uploaded_by: req.user.user_id,
    });
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videosService.update(req.user.tenant_id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.videosService.remove(req.user.tenant_id, id);
  }

  // -----------------------------
  // :id PARAMETERIZED ROUTES
  // -----------------------------

  @Get(':id/play')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  async play(@Req() req: any, @Param('id') id: string) {
    const video = await this.videosService.findOne(req.user.tenant_id, id);
    if (!video) throw new NotFoundException('Video not found');

    this.analyticsProducer.emitEvent({
      tenant_id: req.user.tenant_id,
      video_id: id,
      user_id: req.user.user_id,
      event_type: 'play',
    });

    return this.playbackService.getSignedPlaybackUrl(
      `${video.s3_key_prefix}/master.m3u8`,
    );
  }

  @Get(':id/variants')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  listVariants(@Req() req: any, @Param('id') video_id: string) {
    return this.videosService.listVariants(req.user.tenant_id, video_id);
  }

  @Post(':id/variants')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  addVariant(@Req() req: any, @Param('id') video_id: string, @Body() dto: CreateVariantDto) {
    return this.videosService.addVariant(req.user.tenant_id, { ...dto, video_id });
  }

  @Get(':id/thumbnails')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  listThumbnails(@Req() req: any, @Param('id') video_id: string) {
    return this.videosService.listThumbnails(req.user.tenant_id, video_id);
  }

  @Post(':id/thumbnails')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  addThumbnail(@Req() req: any, @Param('id') video_id: string, @Body() dto: CreateThumbnailDto) {
    return this.videosService.addThumbnail(req.user.tenant_id, { ...dto, video_id });
  }

  @Get(':id/captions')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  listCaptions(@Req() req: any, @Param('id') video_id: string) {
    return this.videosService.listCaptions(req.user.tenant_id, video_id);
  }

  @Post(':id/captions')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  addCaption(@Req() req: any, @Param('id') video_id: string, @Body() dto: CreateCaptionDto) {
    return this.videosService.addCaption(req.user.tenant_id, { ...dto, video_id });
  }

  @Post(':id/analytics')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  trackEvent(
    @Req() req: any,
    @Param('id') video_id: string,
    @Body() body: { event_type: string; position_seconds?: number },
  ) {
    this.analyticsProducer.emitEvent({
      tenant_id: req.user.tenant_id,
      video_id,
      user_id: req.user.user_id,
      event_type: body.event_type,
      position_seconds: body.position_seconds,
    });
    return { tracked: true };
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.CLIENTADMIN, Role.SUPERADMIN)
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.videosService.findOne(req.user.tenant_id, id);
  }
}

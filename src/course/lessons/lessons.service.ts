import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { NotFoundException } from '@nestjs/common';
import { Video } from '../../video/videos/entities/video.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly repo: Repository<Lesson>,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
  ) {}

  create(dto: CreateLessonDto) {
    const lesson = this.repo.create(dto);
    return this.repo.save(lesson);
  }

  findByCourse(courseId: string, tenant_id: string) {
    return this.repo.find({
      where: { course_id: courseId, tenant_id },
      order: { order_index: 'ASC' },
    });
  }

  findOne(id: string, tenant_id: string) {
    return this.repo.findOne({ where: { id, tenant_id } });
  }

  update(id: string, tenant_id: string, dto: UpdateLessonDto) {
    return this.repo.update({ id, tenant_id }, dto);
  }

  remove(id: string, tenant_id: string) {
    return this.repo.delete({ id, tenant_id });
  }

  async replaceVideo(
    lessonId: string,
    newVideoId: string,
    tenantId: string,
  ) {
    const lesson = await this.repo.findOne({
      where: { id: lessonId, tenant_id: tenantId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const oldVideoId = lesson.video_id;

    // Update lesson → new video
    lesson.video_id = newVideoId;
    await this.repo.save(lesson);

    // Unlink old video from this lesson
    if (oldVideoId) {
      await this.videoRepo.update(
        { id: oldVideoId, tenant_id: tenantId },
        { lesson_id: null },
      );
    }

    // Link new video to this lesson
    await this.videoRepo.update(
      { id: newVideoId, tenant_id: tenantId },
      { lesson_id: lessonId },
    );

    return {
      success: true,
      lesson_id: lesson.id,
      old_video_id: oldVideoId,
      new_video_id: newVideoId,
    };
  }

}

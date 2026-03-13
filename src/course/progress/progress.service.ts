import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LessonProgress } from './lesson-progress.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Lesson } from '../lessons/lesson.entity';
import { CompleteLessonDto } from './dto/complete-lesson.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(LessonProgress)
    private readonly repo: Repository<LessonProgress>,

    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,

    private readonly dataSource: DataSource,
  ) {}

  async getCourseProgress(tenant_id: string, student_id: string, course_id: string) {
    const totalLessons = await this.lessonRepo.count({ where: { course_id, tenant_id } });

    const completedLessons = await this.repo.count({
      where: { tenant_id, student_id, course_id, completed: true },
    });

    return {
      course_id,
      totalLessons,
      completedLessons,
      progress: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    };
  }

  async getLessonProgressList(tenant_id: string, student_id: string, course_id: string) {
    return this.repo.find({
      where: { tenant_id, student_id, course_id },
      order: { lesson_id: 'ASC' },
    });
  }

  async getCourseProgressPercentage(tenantId: string, courseId: string, studentId: string) {
    const totalLessons = await this.lessonRepo.count({
      where: { tenant_id: tenantId, course_id: courseId },
    });

    if (totalLessons === 0) return { totalLessons: 0, completedLessons: 0, percentage: 0 };

    const completedLessons = await this.repo.count({
      where: { tenant_id: tenantId, student_id: studentId, course_id: courseId, completed: true },
    });

    return {
      totalLessons,
      completedLessons,
      percentage: Math.round((completedLessons / totalLessons) * 100),
    };
  }

  async getResumeLesson(tenantId: string, courseId: string, studentId: string) {
    const lessons = await this.lessonRepo.find({
      where: { tenant_id: tenantId, course_id: courseId },
      order: { order_index: 'ASC' },
    });

    if (!lessons.length) return null;

    const completed = await this.repo.find({
      where: { tenant_id: tenantId, course_id: courseId, student_id: studentId, completed: true },
    });

    const completedIds = new Set(completed.map(p => p.lesson_id));
    const nextLesson = lessons.find(lesson => !completedIds.has(lesson.id));

    if (!nextLesson) {
      return { status: 'COMPLETED', lesson: lessons[lessons.length - 1] };
    }

    return { status: 'IN_PROGRESS', lesson: nextLesson };
  }

  async updateProgress(dto: UpdateProgressDto) {
    const existing = await this.repo.findOne({
      where: { tenant_id: dto.tenant_id, student_id: dto.student_id, lesson_id: dto.lesson_id },
    });

    if (existing) {
      existing.status = dto.status;
      existing.completed = dto.status === 'COMPLETED';
      existing.completed_at = dto.status === 'COMPLETED' ? new Date() : null;
      return this.repo.save(existing);
    }

    const progress = this.repo.create({
      tenant_id: dto.tenant_id,
      student_id: dto.student_id,
      course_id: dto.course_id,
      lesson_id: dto.lesson_id,
      status: dto.status,
      completed: dto.status === 'COMPLETED',
      completed_at: dto.status === 'COMPLETED' ? new Date() : null,
    });

    return this.repo.save(progress);
  }

  async completeLesson(dto: CompleteLessonDto, tenantId: string, studentId: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      await qr.query(`SELECT set_config('my.tenant_id', $1, false)`, [tenantId]);
      await qr.query(`SELECT set_config('my.role', $1, false)`, ['STUDENT']);

      let progress = await qr.manager.findOne(LessonProgress, {
        where: { tenant_id: tenantId, student_id: studentId, lesson_id: dto.lesson_id, course_id: dto.course_id },
      });

      if (!progress) {
        progress = qr.manager.create(LessonProgress, {
          tenant_id: tenantId,
          student_id: studentId,
          lesson_id: dto.lesson_id,
          course_id: dto.course_id,
          completed: true,
          completed_at: new Date(),
          status: 'COMPLETED',
        });
      } else {
        progress.completed = true;
        progress.completed_at = new Date();
        progress.status = 'COMPLETED';
      }

      return await qr.manager.save(LessonProgress, progress);
    } finally {
      await qr.release();
    }
  }
}

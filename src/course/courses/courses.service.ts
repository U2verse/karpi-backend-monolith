import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import slugify from 'slugify';

import { Course } from './courses.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SaveCourseStructureDto } from './dto/save-course-structure.dto';
import { ReorderCourseDto } from './dto/reorder-course.dto';
import { CourseStatus } from './course-status.enum';
import { CourseModule } from '../course-modules/course-module.entity';
import { Lesson } from '../lessons/lesson.entity';
import { LessonProgress } from '../progress/lesson-progress.entity';


@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly repo: Repository<Course>,
    private readonly dataSource: DataSource,

    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
  ) {}

  async create(dto: CreateCourseDto, tenant_id: string, user_id: string) {
    if (!dto.title || typeof dto.title !== 'string') {
      throw new BadRequestException('title is required and must be a string');
    }
    const baseSlug = slugify(dto.title, { lower: true, strict: true, trim: true });
    const slug = `${baseSlug}-${Date.now()}`;

    const course = this.repo.create({
      tenant_id,
      title: dto.title,
      slug,
      description: dto.description ?? null,
      level: dto.level ?? null,
      price: dto.price ?? 0,
      discount: dto.discount ?? 0,
      status: CourseStatus.DRAFT,
      created_by: user_id,
    } as Partial<Course>);

    return this.repo.save(course);
  }

  findAll(tenant_id: string) {
    return this.repo.find({ where: { tenant_id }, order: { created_at: 'DESC' } });
  }

  findOne(id: string, tenant_id: string) {
    return this.repo.findOne({ where: { id, tenant_id } });
  }

  async update(id: string, tenant_id: string, dto: UpdateCourseDto) {
    return this.repo.update({ id, tenant_id }, dto);
  }

  async remove(id: string, tenant_id: string) {
    const course = await this.repo.findOne({ where: { id, tenant_id } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const progressCount = await this.progressRepo.count({
      where: { course_id: id, tenant_id },
    });

    if (progressCount > 0) {
      throw new BadRequestException('Cannot delete course with existing student progress');
    }

    await this.repo.delete({ id, tenant_id });
    return { success: true };
  }

  async saveStructure(courseId: string, tenantId: string, dto: SaveCourseStructureDto) {
    const { modules } = dto;

    return this.dataSource.transaction(async (manager) => {
      const courseRepo = manager.getRepository(Course);
      const moduleRepo = manager.getRepository(CourseModule);
      const lessonRepo = manager.getRepository(Lesson);

      const course = await courseRepo.findOne({ where: { id: courseId, tenant_id: tenantId } });
      if (!course) throw new NotFoundException('Course not found');

      // Collect IDs present in the new structure so we know what to remove.
      const incomingModuleIds = new Set(modules.map(m => m.id).filter(Boolean) as string[]);
      const incomingLessonIds = new Set(
        modules.flatMap(m => m.lessons.map(l => l.id).filter(Boolean)) as string[],
      );

      // Delete only lessons that were removed from the structure.
      // ON DELETE CASCADE on lesson_progress means only truly-removed lessons
      // lose their progress rows — existing lessons keep theirs.
      const existingLessons = await lessonRepo.find({
        where: { course_id: courseId, tenant_id: tenantId },
      });
      const removedLessonIds = existingLessons
        .filter(l => !incomingLessonIds.has(l.id))
        .map(l => l.id);
      if (removedLessonIds.length) {
        await lessonRepo.delete(removedLessonIds);
      }

      // Delete only modules that were removed from the structure.
      const existingModules = await moduleRepo.find({
        where: { course_id: courseId, tenant_id: tenantId },
      });
      const removedModuleIds = existingModules
        .filter(m => !incomingModuleIds.has(m.id))
        .map(m => m.id);
      if (removedModuleIds.length) {
        await moduleRepo.delete(removedModuleIds);
      }

      // Upsert modules and lessons.
      // Existing rows (id present) are updated in-place — their UUIDs never
      // change, so lesson_progress FK references stay valid.
      // New rows (no id) are inserted and receive fresh UUIDs.
      for (let m = 0; m < modules.length; m++) {
        const modData = modules[m];
        let savedModuleId: string;

        if (modData.id) {
          await moduleRepo.update(
            { id: modData.id, course_id: courseId, tenant_id: tenantId },
            { title: modData.title, order_index: m },
          );
          savedModuleId = modData.id;
        } else {
          const moduleEntity = moduleRepo.create({
            tenant_id: tenantId,
            course_id: courseId,
            title: modData.title,
            order_index: m,
          });
          const saved = await moduleRepo.save(moduleEntity);
          savedModuleId = saved.id;
        }

        for (let l = 0; l < modData.lessons.length; l++) {
          const lessonData = modData.lessons[l];

          if (lessonData.id) {
            await lessonRepo.update(
              { id: lessonData.id, course_id: courseId, tenant_id: tenantId },
              {
                title: lessonData.title,
                type: lessonData.type,
                video_id: lessonData.video_id ?? undefined,
                content: lessonData.content ?? undefined,
                module_id: savedModuleId,
                order_index: l,
              },
            );
          } else {
            const lesson = lessonRepo.create({
              tenant_id: tenantId,
              course_id: courseId,
              module_id: savedModuleId,
              title: lessonData.title,
              type: lessonData.type,
              video_id: lessonData.video_id ?? null,
              content: lessonData.content ?? null,
              order_index: l,
            } as Partial<Lesson>);
            await lessonRepo.save(lesson);
          }
        }
      }

      return { success: true };
    });
  }

  async publish(courseId: string, tenantId: string) {
    const course = await this.repo.findOne({ where: { id: courseId, tenant_id: tenantId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status === CourseStatus.PUBLISHED) throw new BadRequestException('Course is already published');

    course.status = CourseStatus.PUBLISHED;
    return this.repo.save(course);
  }

  async getLessonsWithStatus(tenantId: string, courseId: string, studentId: string) {
    // Use a single query runner so set_config and all queries share the same connection,
    // avoiding the RLS + connection-pool race condition where my.tenant_id may not be set.
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    let modules: CourseModule[], lessons: Lesson[], progress: LessonProgress[];
    try {
      await qr.query(`SELECT set_config('my.tenant_id', $1, false)`, [tenantId]);
      await qr.query(`SELECT set_config('my.role', $1, false)`, ['STUDENT']);

      [modules, lessons, progress] = await Promise.all([
        qr.manager.find(CourseModule, {
          where: { tenant_id: tenantId, course_id: courseId },
          order: { order_index: 'ASC' },
        }),
        qr.manager.find(Lesson, {
          where: { tenant_id: tenantId, course_id: courseId },
          order: { order_index: 'ASC' },
        }),
        qr.manager.find(LessonProgress, {
          where: { tenant_id: tenantId, course_id: courseId, student_id: studentId },
        }),
      ]);
    } finally {
      await qr.release();
    }

    const moduleOrderMap = new Map(modules.map(m => [m.id, m.order_index]));
    const moduleTitleMap = new Map(modules.map(m => [m.id, m.title]));

    // Sort lessons: module order first, then lesson order within module
    lessons.sort((a, b) => {
      const modA = moduleOrderMap.get(a.module_id) ?? 0;
      const modB = moduleOrderMap.get(b.module_id) ?? 0;
      if (modA !== modB) return modA - modB;
      return a.order_index - b.order_index;
    });

    const completedLessonIds = new Set(progress.filter(p => p.completed).map(p => p.lesson_id));

    return lessons.map((lesson, index) => {
      let status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED' = 'LOCKED';
      if (completedLessonIds.has(lesson.id)) {
        status = 'COMPLETED';
      } else if (index === 0 || completedLessonIds.has(lessons[index - 1]?.id)) {
        status = 'UNLOCKED';
      }
      return {
        lesson_id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        video_id: lesson.video_id ?? null,
        status,
        module_id: lesson.module_id,
        module_title: moduleTitleMap.get(lesson.module_id) ?? null,
      };
    });
  }

  async getStructureForAdmin(courseId: string, tenantId: string) {
    const course = await this.repo.findOne({ where: { id: courseId, tenant_id: tenantId } });
    if (!course) throw new NotFoundException('Course not found');

    const modules = await this.dataSource.getRepository(CourseModule).find({
      where: { course_id: courseId, tenant_id: tenantId },
      order: { order_index: 'ASC' },
    });

    const lessons = await this.dataSource.getRepository(Lesson).find({
      where: { course_id: courseId, tenant_id: tenantId },
      order: { order_index: 'ASC' },
    });

    return {
      id: course.id,
      title: course.title,
      status: course.status,
      modules: modules.map(mod => ({
        id: mod.id,
        title: mod.title,
        lessons: lessons
          .filter(l => l.module_id === mod.id)
          .map(l => ({ id: l.id, title: l.title, type: l.type, video_id: l.video_id ?? null })),
      })),
    };
  }

  async reorderCourse(courseId: string, tenantId: string, dto: ReorderCourseDto) {
    return this.dataSource.transaction(async manager => {
      const moduleRepo = manager.getRepository(CourseModule);
      const lessonRepo = manager.getRepository(Lesson);

      for (const mod of dto.modules) {
        await moduleRepo.update(
          { id: mod.id, course_id: courseId, tenant_id: tenantId },
          { order_index: mod.order_index },
        );
        for (const lesson of mod.lessons) {
          await lessonRepo.update(
            { id: lesson.id, module_id: mod.id, course_id: courseId, tenant_id: tenantId },
            { order_index: lesson.order_index },
          );
        }
      }

      return { success: true };
    });
  }
}

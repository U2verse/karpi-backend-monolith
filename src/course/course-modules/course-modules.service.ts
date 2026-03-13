import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseModule } from './course-module.entity';
import { CreateModuleDto } from './dto/create-module.dto';

@Injectable()
export class CourseModulesService {
  constructor(
    @InjectRepository(CourseModule)
    private readonly repo: Repository<CourseModule>,
  ) {}

  create(dto: CreateModuleDto) {
    const mod = this.repo.create(dto);
    return this.repo.save(mod);
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

  update(id: string, tenant_id: string, dto: any) {
    return this.repo.update({ id, tenant_id }, dto);
  }

  remove(id: string, tenant_id: string) {
    return this.repo.delete({ id, tenant_id });
  }
}

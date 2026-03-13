import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CourseModulesService } from './course-modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';


@Controller('course-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseModulesController {
  constructor(private readonly modulesService: CourseModulesService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  create(@Req() req: any, @Body() dto: CreateModuleDto) {
    dto.tenant_id = req.user.tenant_id;
    return this.modulesService.create(dto);
  }

  @Get(':courseId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  findByCourse(@Req() req: any, @Param('courseId') courseId: string) {
    return this.modulesService.findByCourse(courseId, req.user.tenant_id);
  }
}

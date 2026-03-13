import { Controller, Get, Post, Body, Param, Patch, Delete, Req, Put, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SaveCourseStructureDto } from './dto/save-course-structure.dto';
import { ReorderCourseDto } from './dto/reorder-course.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { Public } from '../../common/decorators/public.decorator';


@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  create(@Req() req: any, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto, req.user.tenant_id, req.user.user_id);
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  findAll(@Req() req: any) {
    return this.coursesService.findAll(req.user.tenant_id);
  }

  @Public()
  @Get('debug')
  debug(@Req() req: any) {
    return { cookies: (req as any).cookies, user: req.user };
  }

  // ⚠️ Static routes MUST come before :id param routes
  @Get('admin/:courseId/structure')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  getCourseStructureForAdmin(@Param('courseId') courseId: string, @Req() req: any) {
    return this.coursesService.getStructureForAdmin(courseId, req.user.tenant_id);
  }

  @Put('admin/:courseId/reorder')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  reorderCourse(@Param('courseId') courseId: string, @Body() dto: ReorderCourseDto, @Req() req: any) {
    return this.coursesService.reorderCourse(courseId, req.user.tenant_id, dto);
  }

  @Get('student/:courseId/lessons')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  getLessonsForStudent(@Param('courseId') courseId: string, @Req() req: any) {
    return this.coursesService.getLessonsWithStatus(req.user.tenant_id, courseId, req.user.user_id);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.coursesService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, req.user.tenant_id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.coursesService.remove(id, req.user.tenant_id);
  }

  @Post(':id/structure')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  saveStructure(@Req() req: any, @Param('id') id: string, @Body() dto: SaveCourseStructureDto) {
    return this.coursesService.saveStructure(id, req.user.tenant_id, dto);
  }

  @Post(':id/publish')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  publish(@Req() req: any, @Param('id') id: string) {
    return this.coursesService.publish(id, req.user.tenant_id);
  }

  @Get(':id/lessons')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  getCourseLessons(@Param('id') courseId: string, @Req() req: any) {
    return this.coursesService.getLessonsWithStatus(req.user.tenant_id, courseId, req.user.user_id);
  }
}

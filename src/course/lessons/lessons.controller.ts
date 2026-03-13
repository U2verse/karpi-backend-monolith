import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';


@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  create(@Req() req: any, @Body() dto: CreateLessonDto) {
    dto.tenant_id = req.user.tenant_id;
    return this.lessonsService.create(dto);
  }

  @Post('admin/:lessonId/replace-video')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  replaceVideo(@Param('lessonId') lessonId: string, @Body() body: { new_video_id: string }, @Req() req: any) {
    return this.lessonsService.replaceVideo(lessonId, body.new_video_id, req.user.tenant_id);
  }

  @Get('course/:courseId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  findByCourse(@Req() req: any, @Param('courseId') courseId: string) {
    return this.lessonsService.findByCourse(courseId, req.user.tenant_id);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.lessonsService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, req.user.tenant_id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.lessonsService.remove(id, req.user.tenant_id);
  }
}

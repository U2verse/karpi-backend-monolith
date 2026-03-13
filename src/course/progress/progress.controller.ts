import { Controller, Get, Post, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';


@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  updateProgress(@Body() dto: UpdateProgressDto) {
    return this.progressService.updateProgress(dto);
  }

  @Get('student/:studentId/course/:courseId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  getCourseProgress(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    if (req.user.role === Role.STUDENT && req.user.user_id !== studentId) {
      throw new ForbiddenException('Access denied');
    }
    return this.progressService.getCourseProgressPercentage(req.user.tenant_id, courseId, studentId);
  }

  @Get(':courseId/resume')
  @Roles(Role.STUDENT, Role.SUPERADMIN, Role.CLIENTADMIN)
  resumeCourse(@Req() req: any, @Param('courseId') courseId: string) {
    return this.progressService.getResumeLesson(req.user.tenant_id, courseId, req.user.user_id);
  }

  @Post('lesson-complete')
  @Roles(Role.STUDENT, Role.SUPERADMIN, Role.CLIENTADMIN)
  completeLesson(@Body() dto: CompleteLessonDto, @Req() req: any) {
    return this.progressService.completeLesson(dto, req.user.tenant_id, req.user.user_id);
  }
}

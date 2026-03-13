import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';


@Controller('course-enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  create(@Req() req: any, @Body() dto: CreateEnrollmentDto) {
    dto.tenant_id = req.user.tenant_id;
    return this.enrollmentsService.create(dto);
  }

  @Get('course/:courseId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findByCourse(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findByCourse(courseId);
  }

  @Get('student/:studentId')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN, Role.STUDENT)
  findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findByStudent(studentId);
  }
}

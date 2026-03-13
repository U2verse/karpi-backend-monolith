import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  create(@Body() dto: CreateEnrollmentDto, @Req() req: any) {
    const tenant_id = req.user.tenant_id;
    return this.enrollmentsService.create({
      tenant_id,
      student_id: dto.student_id,
      course_id: dto.course_id,
      course_start_date: dto.course_start_date,
      status: dto.status,
    });
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findAll(@Req() req: any) {
    return this.enrollmentsService.findAll(req.user.tenant_id);
  }

  // NOTE: 'me' must be before ':id' to avoid route conflict
  @Get('me')
  @Roles(Role.STUDENT, Role.SUPERADMIN)
  getMyEnrollments(@Req() req: any) {
    const tenant_id = req.user.tenant_id;
    const student_id = req.user.user_id;
    return this.enrollmentsService.findByStudent(tenant_id, student_id);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.enrollmentsService.findOne(req.user.tenant_id, id);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollmentsService.update(req.user.tenant_id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.enrollmentsService.remove(req.user.tenant_id, id);
  }
}

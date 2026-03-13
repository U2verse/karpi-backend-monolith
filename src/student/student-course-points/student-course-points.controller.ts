import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudentCoursePointsService } from './student-course-points.service';
import { CreateStudentCoursePointsDto } from './dto/create-student-course-points.dto';
import { UpdateStudentCoursePointsDto } from './dto/update-student-course-points.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('points')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentCoursePointsController {
  constructor(private readonly pointsService: StudentCoursePointsService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  create(@Req() req: any, @Body() dto: CreateStudentCoursePointsDto) {
    return this.pointsService.create(dto, req.user.tenant_id);
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findAll(@Req() req: any) {
    return this.pointsService.findAll(req.user.tenant_id);
  }

  // NOTE: 'me' must be before '/student/:id' and ':id' to avoid route conflict
  @Get('me')
  @Roles(Role.STUDENT)
  getMyPoints(@Req() req: any) {
    return this.pointsService.findByStudent(req.user.tenant_id, req.user.user_id);
  }

  @Get('/student/:id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findByStudent(@Req() req: any, @Param('id') student_id: string) {
    return this.pointsService.findByStudent(req.user.tenant_id, student_id);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.pointsService.findOne(req.user.tenant_id, id);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStudentCoursePointsDto) {
    return this.pointsService.update(req.user.tenant_id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.pointsService.remove(req.user.tenant_id, id);
  }
}

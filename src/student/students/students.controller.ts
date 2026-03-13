import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  create(@Body() dto: CreateStudentDto, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.create({ ...dto, tenant_id: tenantId });
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findAll(@Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.findAll(tenantId);
  }

  // NOTE: 'me' must be before ':id' to avoid route conflict
  @Get('me')
  @Roles(Role.STUDENT, Role.SUPERADMIN)
  getMyProfile(@Req() req) {
    const tenant_id = req.user.tenant_id;
    const student_id = req.user.user_id;
    return this.studentsService.findOne(tenant_id, student_id);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.CLIENTADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateStudentDto>,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.remove(tenantId, id);
  }
}

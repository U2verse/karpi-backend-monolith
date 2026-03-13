import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { StudentCoursePointsService } from '../student-course-points/student-course-points.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('students/me/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentDashboardController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly pointsService: StudentCoursePointsService,
  ) {}

  @Get()
  @Roles(Role.STUDENT)
  async getDashboard(@Req() req: any) {
    const tenant_id = req.user.tenant_id;
    const student_id = req.user.user_id;

    const profile = await this.studentsService.findOne(tenant_id, student_id);
    const enrollments = await this.enrollmentsService.findByStudent(tenant_id, student_id);
    const points = await this.pointsService.findByStudent(tenant_id, student_id);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
    const activeCourses = enrollments.filter((e) => e.status === 'active').length;
    const totalPoints = points.reduce((sum, p) => sum + (p.total_points ?? 0), 0);

    return {
      profile,
      stats: { totalCourses, completedCourses, activeCourses, totalPoints },
      enrollments,
      points,
    };
  }
}

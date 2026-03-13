import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { SubmitAdmissionDto } from './dto/submit-admission.dto';
import { CreateAdmissionLinkDto } from './dto/create-admission-link.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generate(@Req() req: any, @Body() dto: CreateAdmissionLinkDto) {
    return this.admissionsService.generateAdmissionLink(req.user ?? null, dto);
  }

  @Public()
  @Get('link/:token')
  async getByToken(@Param('token') token: string) {
    return this.admissionsService.getLinkByToken(token);
  }

  @Public()
  @Post('submit/:token')
  async submit(@Param('token') token: string, @Body() dto: SubmitAdmissionDto) {
    return this.admissionsService.submitAdmission(token, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    return this.admissionsService.listAdmissions(req.user);
  }
}

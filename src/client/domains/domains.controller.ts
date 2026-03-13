import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';

import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('domains')
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  // ==========================================================
  // PUBLIC — CHECK SUBDOMAIN AVAILABILITY (NO AUTH)
  // ==========================================================
  @Public()
  @Get('check-subdomain/:subdomain')
  checkSubdomain(@Param('subdomain') subdomain: string) {
    return this.domainsService.checkSubdomainAvailability(subdomain);
  }

  // ==========================================================
  // PUBLIC — RESOLVE TENANT BY SUBDOMAIN SLUG (NO AUTH)
  // Called by student app middleware to validate the subdomain
  // Returns tenant info if found, 404 if not registered
  // ==========================================================
  @Public()
  @Get('resolve/:slug')
  resolveTenant(@Param('slug') slug: string) {
    return this.domainsService.resolveTenant(slug);
  }

  // ============================================================================
  // CREATE DOMAIN
  // ============================================================================
  @Post()
  create(@Body() dto: CreateDomainDto, @Req() req: any) {
    const userId = req.user.sub; // tenant_id
    return this.domainsService.create(dto, userId);
  }

  // ============================================================================
  // LIST ALL DOMAINS (TENANT-SAFE)
  // ============================================================================
  @Get()
  findAll(@Req() req: any) {
    const userId = req.user.sub;
    return this.domainsService.findAll(userId);
  }

  // ============================================================================
  // GET DOMAIN BY ID (TENANT-SAFE)
  // ============================================================================
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.domainsService.findOne(+id, userId);
  }

  // ============================================================================
  // UPDATE DOMAIN
  // ============================================================================
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDomainDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.domainsService.update(+id, dto, userId);
  }

  // ============================================================================
  // DELETE DOMAIN
  // ============================================================================
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.domainsService.remove(+id, userId);
  }

  // ============================================================================
  // VERIFY DOMAIN (DNS TXT CHECK)
  // ============================================================================
  @Get(':id/verify')
  verifyDomain(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.domainsService.verifyDomain(+id, userId);
  }

  @Post(':id/regenerate-code')
  regenerate(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.domainsService.regenerateVerificationCode(+id, userId);
  }

  // ---------------------------------------------------------
// SET PRIMARY DOMAIN
// ---------------------------------------------------------
  @Patch(':id/set-primary')
  setPrimary(
    @Param('id') domainId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.domainsService.setPrimaryDomain(+domainId, userId);
  }

  @Get('primary')
  getPrimary(@Req() req: any) {
    const userId = req.user.sub;
    return this.domainsService.getPrimaryDomain(userId);
  }

  @Post(':id/reverify')
  reverify(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.domainsService.reverify(+id, userId);
  }


}

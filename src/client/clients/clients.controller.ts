import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ---------------------------------------------------------
  // CREATE CLIENT (INTERNAL — enrollment service only)
  // ---------------------------------------------------------
  @Public()
  @Post('internal')
  async createInternal(@Body() dto: CreateClientDto, @Req() req) {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_ADMIN_TOKEN) {
      throw new UnauthorizedException('Invalid internal secret');
    }
    return this.clientsService.create(dto);
  }

  // ---------------------------------------------------------
  // CREATE CLIENT (SUPERADMIN ONLY)
  // ---------------------------------------------------------
  @Post()
  async create(@Body() dto: CreateClientDto, @Req() req) {
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenException('Only SUPERADMIN can create clients');
    }
    return this.clientsService.create(dto);
  }

  // ---------------------------------------------------------
  // GET ALL CLIENTS (SUPERADMIN ONLY)
  // ---------------------------------------------------------
  @Get()
  async findAll(@Req() req) {
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenException('Only SUPERADMIN can view all clients');
    }
    return this.clientsService.findAll();
  }

  // ---------------------------------------------------------
  // GET ONE CLIENT (SUPERADMIN ONLY)
  // ---------------------------------------------------------
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenException('Only SUPERADMIN can view clients');
    }
    return this.clientsService.findOne(+id);
  }

  // ---------------------------------------------------------
  // UPDATE CLIENT (SUPERADMIN ONLY)
  // ---------------------------------------------------------
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req,
  ) {
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenException('Only SUPERADMIN can update clients');
    }
    return this.clientsService.update(+id, dto);
  }

  // ---------------------------------------------------------
  // DELETE CLIENT (SUPERADMIN ONLY)
  // ---------------------------------------------------------
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenException('Only SUPERADMIN can delete clients');
    }
    return this.clientsService.remove(+id);
  }

  // ---------------------------------------------------------
  // GET CLIENT OVERVIEW
  // ---------------------------------------------------------
  @Get(':client_id/overview')
  async getClientOverview(
    @Param('client_id', ParseIntPipe) client_id: number,
  ) {
    const overview = await this.clientsService.getClientOverview(client_id);
    if (!overview) {
      throw new NotFoundException('Client not found');
    }
    return overview;
  }
}

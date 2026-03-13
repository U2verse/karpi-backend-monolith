import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async send(
    @Body()
    body: {
      client_name: string;
      email: string;
      whatsapp?: string;
      plan_id?: number;
      plan_name?: string;
    },
  ) {
    return this.inviteService.sendInvite(body);
  }

  @Get('validate')
  async validate(@Query('token') token: string) {
    const invite = await this.inviteService.validateToken(token);
    if (!invite) return { valid: false };
    return {
      valid: true,
      client_name: invite.client_name,
      email: invite.email,
      plan_id: invite.plan_id,
      plan_name: invite.plan_name,
      expires_at: invite.expires_at,
    };
  }
}

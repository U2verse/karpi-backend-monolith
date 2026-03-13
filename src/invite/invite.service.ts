import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invite } from '../shared/entities/invite.entity';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class InviteService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Invite)
    private inviteRepo: Repository<Invite>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendInvite(dto: {
    client_name: string;
    email: string;
    whatsapp?: string;
    plan_id?: number;
    plan_name?: string;
  }) {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.inviteRepo.save({
      token,
      client_name: dto.client_name,
      email: dto.email,
      whatsapp: dto.whatsapp ?? null,
      plan_id: dto.plan_id ?? null,
      plan_name: dto.plan_name ?? null,
      expires_at: expiresAt,
    });

    const enrollUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3002'}/enroll?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">You're invited to set up your academy on Karpi LMS</h2>
        <p>Hi <strong>${dto.client_name}</strong>,</p>
        <p>You have been invited to enroll your academy on <strong>Karpi LMS</strong>.</p>
        ${dto.plan_name ? `<p>Selected Plan: <strong>${dto.plan_name}</strong></p>` : ''}
        <p>Click the button below to complete your enrollment:</p>
        <a href="${enrollUrl}"
           style="display:inline-block; padding:12px 28px; background:#1a1a2e; color:#fff;
                  text-decoration:none; border-radius:6px; font-weight:bold; margin:16px 0;">
          Complete Enrollment
        </a>
        <p style="color:#666; font-size:13px;">This link expires in 7 days.</p>
        <p style="color:#666; font-size:13px;">If the button doesn't work, copy this link:<br/>
          <a href="${enrollUrl}">${enrollUrl}</a>
        </p>
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;"/>
        <p style="color:#999; font-size:12px;">Karpi LMS &mdash; Powered by U2 Verse</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL ?? 'Karpi <support@u2verse.com>',
        to: dto.email,
        subject: `You're invited to enroll on Karpi LMS`,
        html,
      });
    } catch (err: any) {
      console.error('SMTP error:', err);
      throw new InternalServerErrorException(
        `SMTP failed: ${err?.message ?? String(err)}`,
      );
    }

    return { success: true, expires_at: expiresAt };
  }

  async validateToken(token: string): Promise<Invite | null> {
    const invite = await this.inviteRepo.findOne({ where: { token } });
    if (!invite) return null;
    if (invite.used_at) return null;
    if (invite.expires_at < new Date()) return null;
    return invite;
  }

  async markUsed(token: string) {
    await this.inviteRepo.update({ token }, { used_at: new Date() });
  }
}

import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Res,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { CsrfGuard } from '../common/guards/csrf.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly dataSource: DataSource, // Inject DataSource
  ) {}

  /**
   * LOGIN
   * Body: { email, password }
   * Returns: { access_token, refresh_token }
   */
 /*  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    console.log('LOGIN BODY:', body); // 🔥 ADD THIS
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.get('User-Agent');

    const { access_token, refresh_token } =
      await this.authService.login(body.email, body.password, ip, ua);

    // 🔐 ACCESS TOKEN (short-lived)
    res.cookie('access_token', access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in production (HTTPS)
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // 🔐 REFRESH TOKEN (long-lived)
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in production
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 🔐 CSRF TOKEN (readable by JS)
    const csrfToken = randomBytes(32).toString('hex');

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false, // 👈 must be readable by JS
      sameSite: 'strict',
       secure: process.env.NODE_ENV === 'production', // true in prod
      path: '/',
      maxAge: 15 * 60 * 1000, // match access token
    });

    // ✅ DO NOT return tokens
    return {
      success: true,
    };
  } */

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
     console.log('🔥 LOGIN CONTROLLER HIT', body);
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.get('User-Agent');

    const { access_token, refresh_token } =
      await this.authService.login(body.email, body.password, ip, ua);

    /* // 🔑 ACCESS TOKEN (httpOnly, short-lived)
    res.cookie('access_token', access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    }); */

    // 🔐 Refresh token (httpOnly, automatic)
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 🛡 CSRF token (readable by JS)
    res.cookie('csrf_token', randomBytes(32).toString('hex'), {
      httpOnly: false, // 👈 must be readable by frontend
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 🔑 Access token returned in response
    return {
      access_token,
    };
  }


  /**
   * SAVE REFRESH TOKEN IN HTTP-ONLY COOKIE
   * Body: { refresh_token }
   */
  @Post('save-refresh')
  saveRefresh(
    @Body('refresh_token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.status(400).json({ error: 'No refresh token provided' });
    }

    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: false,   // ⚠ MUST be false for localhost
      sameSite: 'lax', // safer for localhost + redirects
      path: '/',       // 🔥 CRITICAL FIX
       domain: "localhost",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true });
  }

  /**
   * REFRESH TOKEN
   * Body: { user_id, token }
   * Returns: { access_token, refresh_token }
   */
  /* @Post('refresh')
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.get('User-Agent');

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    // 🔁 Refresh session (rotation happens inside service)
    const { access_token, refresh_token } =
      await this.authService.refresh(refreshToken, ip, ua);

    // 🔐 NEW access token (short-lived)
    res.cookie('access_token', access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,           // true in production (HTTPS)
      path: '/',
      maxAge: 15 * 60 * 1000,  // 15 minutes
    });

    // 🔁 ROTATED refresh token (long-lived)
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,           // true in production
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { success: true };
  } */

  @Post('refresh')
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
    @Body() body?: { refresh_token?: string },
  ) {
    // Accept token from httpOnly cookie (preferred) or request body (fallback
    // for clients that can't send credentials with cross-origin requests).
    const refreshToken = req.cookies?.refresh_token ?? body?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const { access_token, refresh_token: newRefresh } =
      await this.authService.refresh(refreshToken);

    res.cookie('refresh_token', newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }



  /**
   * LOGOUT
   * Requires valid access token (Bearer <token>)
   * Revokes all refresh tokens for the user
   */
  
  @Post('logout')
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    // 🔥 Fire-and-forget (NEVER await)
    if (refreshToken) {
      this.authService
        .logout(refreshToken)
        .catch(err => console.error('Logout revoke error:', err));
    }

    // 🔐 Clear refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // 🔐 Clear CSRF token
    res.clearCookie('csrf_token', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }



  /**
   * TEST RLS SESSION VARIABLES
   * Requires Authorization: Bearer <token>
   */
  @Get('test-rls')
  @UseGuards(JwtAuthGuard)
  async testRls(@Req() req: any) {
    const session = await this.dataSource.query(`
      SELECT 
        current_setting('jwt.claims.tenant_id', true) AS tenant,
        current_setting('jwt.claims.role', true) AS role
    `);

    return {
      jwtUser: req.user,
      rlsTenant: session[0].tenant,
      rlsRole: session[0].role,
    };
  }

  @Get("me")
  async me(@Req() req: any) {

    console.log("BACKEND COOKIES:", req.cookies);

    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return null;
    }

    const user = await this.authService.meFromRefresh(refreshToken, req);

    console.log("BACKEND USER:", user);

    return user || null;
  }


  @Post('student/login')
  async studentLogin(
    @Body() body: { email: string; password: string; tenant_id: string },
    @Res({ passthrough: true }) res: any,
  ) {
    const { access_token, refresh_token } = await this.authService.studentLogin(
      body.email,
      body.password,
      body.tenant_id,
    );

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('csrf_token', randomBytes(32).toString('hex'), {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }

  @Post("register")
  async register(
    @Body() body: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role?: string;
      tenant_id?: string | null;
    }
  ) {
    return this.authService.register(body);
  }

  @Post("update-user/:id")
  async updateUser(
    @Param("id") id: string,
    @Body() body: { tenant_id?: string; phone?: string; name?: string }
  ) {
    return this.authService.updateUser(id, body);
  }
  
  // auth.controller.ts
  @Get('health')
  health() {
    return {
      service: "auth",
      status: "ok",
      time: new Date().toISOString(),
    };
  }

}

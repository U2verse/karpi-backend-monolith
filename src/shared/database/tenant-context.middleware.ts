import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private dataSource: DataSource) {}

  async use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      // Middleware runs BEFORE JwtAuthGuard, so req.user is not yet set.
      // Decode the JWT from the Authorization header directly.
      let tenantId = NIL_UUID;
      let role = 'SUPERADMIN';

      const authHeader = req.headers?.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7);
          const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as any;
          tenantId = payload.tenant_id || NIL_UUID;
          role = (payload.role ?? 'superadmin').toUpperCase();
        } catch {
          // Invalid / expired token — use defaults; JwtAuthGuard will reject the request
        }
      }

      await this.dataSource.query(`SELECT set_config('my.tenant_id', $1, false)`, [tenantId]);
      await this.dataSource.query(`SELECT set_config('my.role', $1, false)`, [role]);
    } catch (e) {
      console.error('RLS context error:', e);
    }

    next();
  }
}

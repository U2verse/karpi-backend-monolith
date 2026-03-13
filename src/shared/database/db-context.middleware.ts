import { Injectable, NestMiddleware } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DbContextMiddleware implements NestMiddleware {
  constructor(private dataSource: DataSource) {}

  async use(req: any, res: any, next: () => void) {
    // default (not logged in)
    let tenantId = 0;
    let userId = 0;
    let role = 'none';

    if (req.user) {
      tenantId = req.user.tenant_id;
      userId = req.user.user_id;
      role = req.user.role;
    }

    // Set PostgreSQL session vars for RLS
    await this.dataSource.query(`SET LOCAL my.tenant_id = '${tenantId}'`);
    await this.dataSource.query(`SET LOCAL my.user_id = '${userId}'`);
    await this.dataSource.query(`SET LOCAL my.role = '${role}'`);

    next();
  }
}

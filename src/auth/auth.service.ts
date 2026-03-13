import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../shared/entities/user.entity';
import { RefreshToken } from '../shared/entities/refresh-token.entity';
import { UserAuthAudit } from '../shared/entities/user-auth-audit.entity';
import { Student } from '../shared/entities/student.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwt: JwtService,
    private dataSource: DataSource,   // 🔥 REQUIRED FOR RLS
    
  ) {}

  private async audit(userId: string | null, action: string, req?: any) {
    await this.dataSource.transaction(async (manager) => {
      // Audit writes are always system-level — set SUPERADMIN context (transaction-local)
      await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
      await manager.query(`SELECT set_config('my.tenant_id', '', true)`);
      await manager.getRepository(UserAuthAudit).save({
        user_id: userId,
        tenant_id: req?.tenant_id || null,
        action,
        ip_address: req?.ip || null,
        user_agent: req?.ua || null,
        details: req?.details || null,
      });
    });
  }



  async validateUser(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.password_hash);
    return ok ? user : null;
  }

  async meFromRefresh(raw: string, req: any) {

    console.log("🟡 meFromRefresh START");
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.get ? req.get("User-Agent") : req.headers["user-agent"];

    const user = await this.validateRefreshToken(raw, ip, ua);
     console.log("🟢 USER FOUND:", user);
    return user;
  }


  // ------------------------------------------------------
  // 🔥 LOGIN WITH RLS (transaction + SET LOCAL)
  // ------------------------------------------------------
  async login(email: string, password: string, ip?: string, ua?: string) {

    console.log('🚀 LOGIN SERVICE HIT');
    console.log('EMAIL:', email);
    console.log('PASSWORD RECEIVED:', password);
    console.log('IP:', ip);
    console.log('UA:', ua);
    return this.dataSource.transaction(async (manager) => {

      /**
       * ---------------------------------------------------
       * 1️⃣ SET SYSTEM CONTEXT (SUPERADMIN bypasses RLS)
       * ---------------------------------------------------
       * my.role = 'SUPERADMIN' satisfies the RLS USING clause on all tables,
       * so SELECT/INSERT queries work without needing to disable row_security.
       * (SET LOCAL row_security = off does NOT bypass RLS — it throws errors instead)
       */
      await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
      await manager.query(`SELECT set_config('my.tenant_id', '', true)`);

      /**
       * ---------------------------------------------------
       * 2️⃣ FIND USER
       * ---------------------------------------------------
       */
      const user = await manager
        .getRepository(User)
        .findOne({ where: { email } });

      console.log('👤 USER FOUND:', user);

      if (!user) {
        await manager.query(
          `
          INSERT INTO user_auth_audit (user_id, action, details)
          VALUES (
            NULL,
            'login_failure',
            jsonb_build_object('email', $1::text)
          )
          `,
          [email],
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      /**
       * ---------------------------------------------------
       * 3️⃣ PASSWORD CHECK
       * ---------------------------------------------------
       */
      
      const ok = await bcrypt.compare(password, user.password_hash);
      console.log('🔑 PASSWORD MATCH:', ok);
      if (!ok) {
        await manager.query(
          `
          INSERT INTO user_auth_audit (user_id, action, details)
          VALUES (
            $1::uuid,
            'login_failure',
            jsonb_build_object('email', $2::text)
          )
          `,
          [user.user_id, email],
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      /**
       * ---------------------------------------------------
       * 4️⃣ ROLE CHECK (SUPERADMIN ONLY)
       * ---------------------------------------------------
       */
      if (user.role !== 'superadmin' && user.role !== 'clientadmin') {
        await manager.query(
          `
          INSERT INTO user_auth_audit (user_id, action)
          VALUES ($1::uuid, 'login_blocked_role')
          `,
          [user.user_id],
        );
        throw new UnauthorizedException('Access denied: Super Admins only');
      }

      /**
       * ---------------------------------------------------
       * 5️⃣ LOGIN SUCCESS AUDIT
       * ---------------------------------------------------
       */
      await manager.query(
        `
        INSERT INTO user_auth_audit (user_id, action)
        VALUES ($1::uuid, 'login_success')
        `,
        [user.user_id],
      );

      /**
       * ---------------------------------------------------
       * 6️⃣ APPLY REAL RLS CONTEXT (USER CONTEXT)
       * ---------------------------------------------------
       */
      const tenantId =
        user.tenant_id ?? '00000000-0000-0000-0000-000000000000';

      await manager.query(
        `SELECT set_config('my.role', $1, true)`,
        [user.role],
      );
      await manager.query(
        `SELECT set_config('my.user_id', $1, true)`,
        [user.user_id],
      );
      await manager.query(
        `SELECT set_config('my.tenant_id', $1, true)`,
        [tenantId],
      );

      /**
       * ---------------------------------------------------
       * 7️⃣ ISSUE ACCESS TOKEN
       * ---------------------------------------------------
       */
      const payload = {
        sub: user.user_id,
        email: user.email,
        role: user.role,
        tenant_id: tenantId,
      };

      const access_token = this.jwt.sign(payload, {
        expiresIn: '15m',
      });

      /**
     * ---------------------------------------------------
     * 8️⃣ CREATE REFRESH TOKEN (OPTIMIZED)
     * ---------------------------------------------------
     */
      const raw = randomBytes(48).toString("hex");

      // 🔑 fast lookup fingerprint (SHA-256)
      const fp = createHash("sha256").update(raw).digest("hex");

      // 🔐 secure stored hash (bcrypt)
      const hash = await bcrypt.hash(raw, 12);

      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      await manager.query(
        `
        INSERT INTO refresh_tokens
          (
            user_id,
            tenant_id,
            token_hash,
            token_fingerprint,
            expires_at,
            revoked,
            user_agent,
            ip_address
          )
        VALUES ($1,$2,$3,$4,$5,false,$6,$7)
        `,
        [
          user.user_id,
          tenantId,
          hash,
          fp,
          expiresAt,
          ua ?? null,
          ip ?? null,
        ],
      );


      /**
       * ---------------------------------------------------
       * 9️⃣ RETURN TOKENS
       * ---------------------------------------------------
       */
      return {
        access_token,
        refresh_token: raw,
      };
    });
  }


  // ------------------------------------------------------
  // 🔥 REFRESH WITH RLS (transaction + SET LOCAL)
  // ------------------------------------------------------
  async refresh(raw: string, ip?: string, ua?: string) {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
      await manager.query(`SELECT set_config('my.tenant_id', '', true)`);

      // 1️⃣ Find all non-revoked refresh tokens
      const tokens = await manager.find(RefreshToken, {
        where: { revoked: false },
        relations: ['user'],
      });

      for (const t of tokens) {
        const match = await bcrypt.compare(raw, t.token_hash);
        if (!match) continue;

        // ── Student token branch ───────────────────────────────────
        // Check t.student_id (column) instead of t.student (relation) to
        // avoid RLS JOIN issues with empty tenant context during bulk load.
        if (!t.user && t.student_id) {
          const [student] = await manager.query(
            `SELECT student_id, email, tenant_id FROM students WHERE student_id = $1 LIMIT 1`,
            [t.student_id],
          );
          if (!student) continue;

          if (t.expires_at < new Date()) {
            t.revoked = true;
            await manager.save(t);
            throw new UnauthorizedException('Refresh token expired');
          }

          // Rotate: revoke old, issue new
          t.revoked = true;
          await manager.save(t);

          const newRaw = randomBytes(48).toString('hex');
          const newFp = createHash('sha256').update(newRaw).digest('hex');
          const newHash = await bcrypt.hash(newRaw, 12);
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          await manager.query(
            `INSERT INTO refresh_tokens (student_id, tenant_id, token_hash, token_fingerprint, expires_at, revoked)
             VALUES ($1::uuid, $2, $3, $4, $5, false)`,
            [student.student_id, student.tenant_id, newHash, newFp, expiresAt],
          );

          const access_token = this.jwt.sign(
            { sub: student.student_id, email: student.email, role: 'student', tenant_id: student.tenant_id },
            { expiresIn: '15m' },
          );

          return { access_token, refresh_token: newRaw };
        }

        // ── User (admin / superadmin) token branch ─────────────────
        const user = t.user;
        if (!user) continue;
        const userId = user.user_id;
        const tenantId = user.tenant_id ?? null;
        const role = user.role;

        // 2️⃣ Check expiry
        if (t.expires_at < new Date()) {
          t.revoked = true;
          await manager.save(t);

          await this.audit(userId, 'refresh_expired', { ip, ua });
          throw new UnauthorizedException('Refresh token expired');
        }

        // 3️⃣ Revoke old token (rotation)
        t.revoked = true;
        await manager.save(t);

        // 4️⃣ Update RLS context to the actual user's tenant
        await manager.query(`SELECT set_config('my.tenant_id', $1, true)`, [tenantId ?? '']);
        await manager.query(`SELECT set_config('my.role', $1, true)`, [role.toUpperCase()]);

        // 5️⃣ Create new refresh token
        const newRaw = randomBytes(48).toString('hex');
        const newHash = await bcrypt.hash(newRaw, 12);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const newToken = manager.create(RefreshToken, {
          user,
          user_id: userId,
          tenant_id: tenantId,
          token_hash: newHash,
          expires_at: expiresAt,
          revoked: false,
          ip_address: ip ?? null,
          user_agent: ua ?? null,
        });

        await manager.save(newToken);

        // 6️⃣ Issue new access token
        const payload = {
          sub: userId,
          email: user.email,
          role,
          tenant_id: tenantId,
        };

        const access_token = this.jwt.sign(payload, {
          expiresIn: '15m',
        });

        await this.audit(userId, 'refresh_success', { ip, ua });

        return {
          access_token,
          refresh_token: newRaw,
        };
      }

      // ❌ No matching refresh token
      await this.audit(null, 'refresh_invalid', { ip, ua });
      throw new UnauthorizedException('Invalid refresh token');
    });
  }


  // ------------------------------------------------------
// 🔥 LOGOUT BY REFRESH TOKEN (CORRECT)
// ------------------------------------------------------
  async logout(rawRefreshToken: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
      await manager.query(`SELECT set_config('my.tenant_id', '', true)`);

      const tokens = await manager.find(RefreshToken, {
        where: { revoked: false },
        relations: ['user'],
      });

      for (const t of tokens) {
        const match = await bcrypt.compare(rawRefreshToken, t.token_hash);
        if (!match) continue;

        t.revoked = true;
        await manager.save(t);
        await this.audit(t.user?.user_id ?? null, 'logout');
        return;
      }
    });

    return { ok: true };
  }


  /* async validateRefreshToken(raw: string, ip?: string, ua?: string) {
    const tokens = await this.rtRepo.find({
      relations: ["user"],
      where: { revoked: false },
    });

    for (const t of tokens) {
      const match = await bcrypt.compare(raw, t.token_hash);
      if (!match) continue;

      // expired?
      if (t.expires_at < new Date()) {
        await this.audit(t.user.user_id, "refresh_expired", { ip, ua });
        return null;
      }

      // token valid → return user object
      const user = t.user;
      return {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      };
    }

    // no token matched
    await this.audit(null, "refresh_invalid", { ip, ua });
    return null;
  } */

  async validateRefreshToken(raw: string, ip?: string, ua?: string) {
    console.log("🔵 validateRefreshToken START");

    const fp = createHash("sha256").update(raw).digest("hex");

    // Raw query — handles both user and student tokens without FK relation issues
    const [token] = await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
      await manager.query(`SELECT set_config('my.tenant_id', '', true)`);
      return manager.query(
        `SELECT id, user_id, student_id, token_hash, expires_at, tenant_id
           FROM refresh_tokens
          WHERE revoked = false AND token_fingerprint = $1
          LIMIT 1`,
        [fp],
      );
    });

    if (!token) {
      console.log("🔴 refresh token NOT FOUND");
      await this.audit(null, "refresh_invalid", { ip, ua });
      return null;
    }

    const match = await bcrypt.compare(raw, token.token_hash);
    if (!match) {
      console.log("🔴 hash mismatch");
      await this.audit(token.user_id ?? null, "refresh_invalid", { ip, ua });
      return null;
    }

    if (new Date(token.expires_at) < new Date()) {
      console.log("🔴 refresh expired");
      await this.audit(token.user_id ?? null, "refresh_expired", { ip, ua });
      return null;
    }

    console.log("🟢 refresh token VALID");

    // ── Student token ──────────────────────────────────────────────
    if (token.student_id) {
      const [student] = await this.dataSource.transaction(async (manager) => {
        await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
        await manager.query(`SELECT set_config('my.tenant_id', $1, true)`, [token.tenant_id ?? '']);
        return manager.query(
          `SELECT student_id, email, tenant_id FROM students WHERE student_id = $1 LIMIT 1`,
          [token.student_id],
        );
      });
      if (!student) return null;

      return {
        user_id: student.student_id,
        email: student.email,
        role: 'student',
        tenant_id: student.tenant_id,
        client_id: null,
      };
    }

    // ── User (clientadmin / superadmin) token ─────────────────────
    const [user] = await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
      await manager.query(`SELECT set_config('my.tenant_id', '', true)`);
      return manager.query(
        `SELECT user_id, email, role, tenant_id FROM users WHERE user_id = $1 LIMIT 1`,
        [token.user_id],
      );
    });
    if (!user) return null;

    const tenantId = user.tenant_id;
    let client_id: number | null = null;

    if (tenantId) {
      const [client] = await this.dataSource.query(
        `SELECT client_id FROM clients WHERE tenant_id = $1 LIMIT 1`,
        [tenantId],
      );
      client_id = client?.client_id ?? null;
    }

    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      tenant_id: tenantId,
      client_id,
    };
  }

  async studentLogin(email: string, password: string, tenant_id: string) {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('my.role', 'SUPERADMIN', true)`);
      await manager.query(`SELECT set_config('my.tenant_id', $1, true)`, [tenant_id]);

      const student = await manager
        .getRepository(Student)
        .createQueryBuilder('s')
        .addSelect('s.password_hash')
        .where('s.email = :email AND s.tenant_id = :tenant_id', {
          email: email.toLowerCase(),
          tenant_id,
        })
        .getOne();

      if (!student || !student.password_hash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const ok = await bcrypt.compare(password, student.password_hash);
      if (!ok) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: student.student_id,
        email: student.email,
        role: 'student',
        tenant_id,
      };

      const access_token = this.jwt.sign(payload, { expiresIn: '15m' });

      const raw = randomBytes(48).toString('hex');
      const hash = await bcrypt.hash(raw, 12);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await manager.query(
        `INSERT INTO refresh_tokens (student_id, tenant_id, token_hash, token_fingerprint, expires_at, revoked)
         VALUES ($1::uuid, $2, $3, $4, $5, false)`,
        [
          student.student_id,
          tenant_id,
          hash,
          createHash('sha256').update(raw).digest('hex'),
          expiresAt,
        ],
      );

      return { access_token, refresh_token: raw };
    });
  }

  async register(body: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
    tenant_id?: string | null;
  }) {
    const { name, email, phone, password, role = "clientadmin", tenant_id = null } = body;

    // Check if email exists
    const exists = await this.dataSource.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (exists.length > 0) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await this.dataSource.query(
      `
        INSERT INTO users (
          name, email, password_hash, phone, role, tenant_id
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING user_id;
      `,
      [name, email, hash, phone, role, tenant_id]
    );

    return { user_id: result[0].user_id };
  }

  async updateUser(user_id: string, data: { tenant_id?: string; phone?: string; name?: string }) {
    const fields: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (data.tenant_id !== undefined) {
      fields.push(`tenant_id = $${idx++}`);
      values.push(data.tenant_id);
    }

    if (data.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(data.phone);
    }

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }

    if (fields.length === 0) return { message: "Nothing to update" };

    values.push(user_id);

    await this.dataSource.query(
      `UPDATE users SET ${fields.join(", ")} WHERE user_id = $${idx}`,
      values
    );

    return { success: true };
  }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAuthSchema1699991000000 implements MigrationInterface {
  name = "InitAuthSchema1699991000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // USERS
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        email varchar NOT NULL UNIQUE,
        password_hash text NOT NULL,
        phone varchar(20),
        status varchar(50) NOT NULL DEFAULT 'active',
        role users_role_enum NOT NULL DEFAULT 'student',
        tenant_id uuid,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);

    // USER AUTH AUDIT
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_auth_audit (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        action varchar NOT NULL,
        details jsonb,
        user_id uuid,
        tenant_id uuid,
        ip_address varchar,
        user_agent varchar,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    // REFRESH TOKENS
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash text NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked boolean NOT NULL DEFAULT false,
        user_agent text,
        ip_address varchar(45),
        token_fingerprint varchar(64),
        user_id uuid NOT NULL,
        tenant_id uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_refresh_user
          FOREIGN KEY (user_id)
          REFERENCES users(user_id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_fingerprint
      ON refresh_tokens (token_fingerprint)
      WHERE revoked = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_auth_audit`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}

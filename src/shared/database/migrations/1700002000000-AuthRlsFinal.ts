import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthRlsFinal1700002000000 implements MigrationInterface {
  name = "AuthRlsFinal1700002000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --------------------------------------------------
    // Helper functions (UUID-safe, idempotent)
    // --------------------------------------------------

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS current_tenant_id();
      CREATE FUNCTION current_tenant_id()
      RETURNS uuid AS $$
      BEGIN
        RETURN NULLIF(current_setting('my.tenant_id', true), '')::uuid;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS current_user_role();
      CREATE FUNCTION current_user_role()
      RETURNS text AS $$
      BEGIN
        RETURN NULLIF(current_setting('my.role', true), '');
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    // --------------------------------------------------
    // USERS
    // --------------------------------------------------
    await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE users FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      DROP POLICY IF EXISTS users_rls ON users;
      CREATE POLICY users_rls ON users
      USING (
        current_user_role() = 'SUPERADMIN'
        OR tenant_id = current_tenant_id()
      );
    `);

    // --------------------------------------------------
    // REFRESH TOKENS
    // --------------------------------------------------
    await queryRunner.query(`ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE refresh_tokens FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      DROP POLICY IF EXISTS refresh_tokens_rls ON refresh_tokens;
      CREATE POLICY refresh_tokens_rls ON refresh_tokens
      USING (
        current_user_role() = 'SUPERADMIN'
        OR tenant_id = current_tenant_id()
      );
    `);

    // --------------------------------------------------
    // USER AUTH AUDIT
    // --------------------------------------------------
    await queryRunner.query(`ALTER TABLE user_auth_audit ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE user_auth_audit FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      DROP POLICY IF EXISTS user_auth_audit_rls ON user_auth_audit;
      CREATE POLICY user_auth_audit_rls ON user_auth_audit
      USING (
        current_user_role() = 'SUPERADMIN'
        OR tenant_id = current_tenant_id()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user_auth_audit DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE users DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP FUNCTION IF EXISTS current_user_role()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS current_tenant_id()`);
  }
}

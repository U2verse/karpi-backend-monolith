import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates all client-related tables.
 * Uses IF NOT EXISTS — safe to run even if tables were previously created
 * by the standalone clients-service microservice.
 *
 * RLS uses the monolith's my.role / my.tenant_id convention (not app.current_tenant).
 */
export class InitClientSchema1719000000000 implements MigrationInterface {
  name = 'InitClientSchema1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // -----------------------------------------------------------------
    // EXTENSIONS
    // -----------------------------------------------------------------
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // -----------------------------------------------------------------
    // CLIENTS
    // -----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS clients (
        client_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(255) NOT NULL,
        custom_domain VARCHAR(255),
        domain_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        plan VARCHAR(50),
        primary_domain VARCHAR(255),
        hosting_provider_name VARCHAR(150),
        custom_domain_expiry_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT uq_clients_tenant UNIQUE (tenant_id),
        CONSTRAINT uq_clients_name UNIQUE (name),
        CONSTRAINT uq_clients_subdomain UNIQUE (subdomain)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients (tenant_id);
    `);

    // -----------------------------------------------------------------
    // DOMAINS
    // -----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS domains (
        domain_id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
        domain VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        verification_code TEXT,
        verified BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // -----------------------------------------------------------------
    // CLIENT BRANDING
    // -----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_branding (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
        logo_url TEXT,
        banner_url TEXT,
        theme_color VARCHAR(50),
        primary_color VARCHAR(20),
        secondary_color VARCHAR(20),
        theme_mode VARCHAR(20),
        font_family VARCHAR(50),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // -----------------------------------------------------------------
    // CLIENT PROFILE
    // -----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_profile (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
        academy_name VARCHAR(255) NOT NULL DEFAULT '',
        owner_name VARCHAR(255) NOT NULL DEFAULT '',
        contact_email VARCHAR(255) NOT NULL DEFAULT '',
        phone VARCHAR(20) NOT NULL DEFAULT '',
        address TEXT,
        about TEXT,
        services JSON,
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // -----------------------------------------------------------------
    // CLIENT SETTINGS
    // -----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
        enable_chat BOOLEAN NOT NULL DEFAULT true,
        enable_notifications BOOLEAN NOT NULL DEFAULT true,
        enable_payment BOOLEAN NOT NULL DEFAULT true,
        enable_landing_page BOOLEAN NOT NULL DEFAULT true,
        certificate_auto_generate BOOLEAN NOT NULL DEFAULT false,
        language VARCHAR(10) NOT NULL DEFAULT 'en',
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // -----------------------------------------------------------------
    // CLIENT USAGE
    // -----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_usage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id INTEGER NOT NULL UNIQUE REFERENCES clients(client_id) ON DELETE CASCADE,
        total_storage_used_mb INTEGER NOT NULL DEFAULT 0,
        storage_limit_mb INTEGER NOT NULL DEFAULT 0,
        students_used INTEGER NOT NULL DEFAULT 0,
        students_limit INTEGER NOT NULL DEFAULT 0,
        courses_used INTEGER NOT NULL DEFAULT 0,
        courses_limit INTEGER NOT NULL DEFAULT 0,
        videos_used INTEGER NOT NULL DEFAULT 0,
        videos_limit INTEGER NOT NULL DEFAULT 0,
        assignments_used INTEGER NOT NULL DEFAULT 0,
        assignments_limit INTEGER NOT NULL DEFAULT 0,
        last_reset_at TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // -----------------------------------------------------------------
    // CLIENT LANDING PAGE
    // -----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_landing_page (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
        headline VARCHAR(255),
        subtitle VARCHAR(255),
        about_section TEXT,
        testimonials JSON,
        achievements JSON,
        courses_preview JSON,
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // -----------------------------------------------------------------
    // ENABLE RLS
    // -----------------------------------------------------------------
    const tables = [
      'clients',
      'domains',
      'client_branding',
      'client_profile',
      'client_settings',
      'client_usage',
      'client_landing_page',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
      );
      await queryRunner.query(
        `ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`,
      );
    }

    // -----------------------------------------------------------------
    // RLS POLICIES — monolith convention: my.role / my.tenant_id
    // Drop first (in case microservice created them with different names)
    // -----------------------------------------------------------------
    await queryRunner.query(
      `DROP POLICY IF EXISTS client_isolation ON clients;`,
    );
    await queryRunner.query(`
      CREATE POLICY client_isolation ON clients
      USING (
        current_setting('my.role', true) = 'SUPERADMIN'
        OR tenant_id = current_setting('my.tenant_id', true)::uuid
      );
    `);

    const childTables = [
      'domains',
      'client_branding',
      'client_profile',
      'client_settings',
      'client_usage',
      'client_landing_page',
    ];

    for (const table of childTables) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_isolation ON ${table};`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_tenant_isolation ON ${table};`,
      );
      await queryRunner.query(`
        CREATE POLICY ${table}_isolation ON ${table}
        USING (
          current_setting('my.role', true) = 'SUPERADMIN'
          OR client_id IN (
            SELECT client_id FROM clients
            WHERE tenant_id = current_setting('my.tenant_id', true)::uuid
          )
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'client_landing_page',
      'client_usage',
      'client_settings',
      'client_profile',
      'client_branding',
      'domains',
      'clients',
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }
  }
}

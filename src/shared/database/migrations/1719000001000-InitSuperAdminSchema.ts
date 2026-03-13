import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSuperAdminSchema1719000001000 implements MigrationInterface {
  name = 'InitSuperAdminSchema1719000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* -----------------------------------------------------------------
       ENUMS
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE billing_status_enum AS ENUM ('pending', 'paid', 'failed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE client_plan_subscriptions_renew_type_enum
          AS ENUM ('monthly', 'yearly', 'manual');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    /* -----------------------------------------------------------------
       PLANS
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        price_monthly NUMERIC NOT NULL,
        price_yearly NUMERIC,
        storage_limit_mb INTEGER NOT NULL,
        student_limit INTEGER NOT NULL,
        course_limit INTEGER NOT NULL,
        video_limit INTEGER NOT NULL,
        assignments_limit INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT now(),
        feature_type VARCHAR,
        meaning VARCHAR,
        materials_per_course INTEGER,
        student_app_access VARCHAR,
        admin_logins INTEGER,
        certificates VARCHAR,
        analytics VARCHAR,
        branding VARCHAR,
        custom_domain VARCHAR,
        support_level VARCHAR,
        subdomain_included BOOLEAN DEFAULT true,
        save_percentage VARCHAR,
        best_pick BOOLEAN DEFAULT false
      )
    `);

    /* -----------------------------------------------------------------
       CLIENT PLAN SUBSCRIPTIONS
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_plan_subscriptions (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        active BOOLEAN DEFAULT true,
        upgraded_from INTEGER,
        created_at TIMESTAMP DEFAULT now(),
        renew_type client_plan_subscriptions_renew_type_enum NOT NULL,
        CONSTRAINT fk_cps_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
      )
    `);

    /* -----------------------------------------------------------------
       BILLING
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        subscription_id INTEGER NOT NULL,
        amount NUMERIC NOT NULL,
        transaction_id VARCHAR,
        invoice_url TEXT,
        paid_on TIMESTAMP,
        created_at TIMESTAMP DEFAULT now(),
        status billing_status_enum NOT NULL,
        CONSTRAINT fk_billing_subscription
          FOREIGN KEY (subscription_id)
          REFERENCES client_plan_subscriptions(id)
      )
    `);

    /* -----------------------------------------------------------------
       CLIENT INVOICES
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_invoices (
        invoice_id SERIAL PRIMARY KEY,
        tenant_id INTEGER,
        billing_id INTEGER,
        invoice_url TEXT,
        invoice_number VARCHAR,
        issue_date DATE,
        amount NUMERIC,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        client_id INTEGER,
        subscription_id INTEGER,
        currency VARCHAR(10),
        status VARCHAR(20)
      )
    `);

    /* -----------------------------------------------------------------
       CLIENT LIMITS OVERRIDE
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_limits_override (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        override_storage_mb INTEGER,
        override_students INTEGER,
        override_courses INTEGER,
        override_videos INTEGER,
        override_assignments INTEGER,
        reason TEXT,
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    /* -----------------------------------------------------------------
       CLIENT STATUS LOGS
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_status_logs (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        previous_status VARCHAR NOT NULL,
        new_status VARCHAR NOT NULL,
        changed_by INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    /* -----------------------------------------------------------------
       CLIENT USAGE HISTORY
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_usage_history (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        month VARCHAR NOT NULL,
        storage_used_mb INTEGER NOT NULL,
        students_used INTEGER NOT NULL,
        videos_used INTEGER NOT NULL,
        courses_used INTEGER NOT NULL,
        generated_at TIMESTAMP DEFAULT now()
      )
    `);

    /* -----------------------------------------------------------------
       ENROLLMENT INVITES
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enrollment_invites (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        whatsapp VARCHAR,
        plan_id INTEGER,
        token VARCHAR NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    /* -----------------------------------------------------------------
       ENROLLMENTS
    ----------------------------------------------------------------- */

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        plan TEXT,
        billing_type TEXT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        billing_name TEXT,
        address_line TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        gst_no TEXT,
        pan_no TEXT,
        amount NUMERIC(10,2),
        payment_mode TEXT,
        payment_status TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        client_id INTEGER,
        plan_id INTEGER,
        plan_name TEXT
      )
    `);

    /* -----------------------------------------------------------------
       RLS — Enable & Policies
       Uses 'SUPERADMIN' (uppercase) to match TenantContextMiddleware
    ----------------------------------------------------------------- */

    const tables = [
      'plans',
      'client_plan_subscriptions',
      'billing',
      'client_invoices',
      'client_limits_override',
      'client_status_logs',
      'client_usage_history',
      'enrollment_invites',
      'enrollments',
    ];

    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
      `);

      await queryRunner.query(`
        ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          DROP POLICY IF EXISTS superadmin_full_access_${table} ON ${table};
          CREATE POLICY superadmin_full_access_${table}
          ON ${table}
          FOR ALL
          USING (current_user_role() = 'SUPERADMIN')
          WITH CHECK (current_user_role() = 'SUPERADMIN');
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'enrollments',
      'enrollment_invites',
      'client_usage_history',
      'client_status_logs',
      'client_limits_override',
      'client_invoices',
      'billing',
      'client_plan_subscriptions',
      'plans',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS superadmin_full_access_${table} ON ${table};`,
      );
      await queryRunner.query(
        `ALTER TABLE IF EXISTS ${table} DISABLE ROW LEVEL SECURITY;`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS ${table};`);
    }

    await queryRunner.query(
      `DROP TYPE IF EXISTS billing_status_enum;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS client_plan_subscriptions_renew_type_enum;`,
    );
  }
}

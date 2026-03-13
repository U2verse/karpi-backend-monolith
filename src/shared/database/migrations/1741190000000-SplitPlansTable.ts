import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitPlansTable1741190000000 implements MigrationInterface {
  name = 'SplitPlansTable1741190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* -----------------------------------------------------------------
       1. CREATE plan_limits
    ----------------------------------------------------------------- */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plan_limits (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL,
        storage_mb INTEGER,
        student_limit INTEGER,
        course_limit INTEGER,
        video_limit INTEGER,
        assignment_limit INTEGER,
        materials_per_course INTEGER,
        admin_logins INTEGER,
        CONSTRAINT fk_plan_limits_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
      )
    `);

    /* -----------------------------------------------------------------
       2. CREATE plan_features
    ----------------------------------------------------------------- */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plan_features (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL,
        student_app_access BOOLEAN DEFAULT true,
        certificates VARCHAR,
        custom_domain BOOLEAN DEFAULT false,
        subdomain BOOLEAN DEFAULT true,
        analytics VARCHAR,
        branding VARCHAR,
        support_level VARCHAR,
        CONSTRAINT fk_plan_features_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
      )
    `);

    /* -----------------------------------------------------------------
       3. MIGRATE existing plans data into new tables
          -1 stored in old columns = unlimited → NULL in new tables
    ----------------------------------------------------------------- */
    await queryRunner.query(`
      INSERT INTO plan_limits (plan_id, storage_mb, student_limit, course_limit, video_limit, assignment_limit, materials_per_course, admin_logins)
      SELECT
        id,
        NULLIF(storage_limit_mb, -1),
        NULLIF(student_limit, -1),
        NULLIF(course_limit, -1),
        NULLIF(video_limit, -1),
        NULLIF(assignments_limit, -1),
        NULLIF(materials_per_course, -1),
        NULLIF(admin_logins, -1)
      FROM plans
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO plan_features (plan_id, student_app_access, certificates, custom_domain, subdomain, analytics, branding, support_level)
      SELECT
        id,
        CASE WHEN student_app_access IS NOT NULL THEN true ELSE true END,
        CASE WHEN certificates IN ('Yes', 'Yes (Advanced)') THEN certificates ELSE NULL END,
        CASE WHEN custom_domain = 'Yes' THEN true ELSE false END,
        COALESCE(subdomain_included, true),
        analytics,
        branding,
        support_level
      FROM plans
      ON CONFLICT DO NOTHING
    `);

    /* -----------------------------------------------------------------
       4. DROP old columns from plans
    ----------------------------------------------------------------- */
    await queryRunner.query(`
      ALTER TABLE plans
        DROP COLUMN IF EXISTS storage_limit_mb,
        DROP COLUMN IF EXISTS student_limit,
        DROP COLUMN IF EXISTS course_limit,
        DROP COLUMN IF EXISTS video_limit,
        DROP COLUMN IF EXISTS assignments_limit,
        DROP COLUMN IF EXISTS materials_per_course,
        DROP COLUMN IF EXISTS admin_logins,
        DROP COLUMN IF EXISTS student_app_access,
        DROP COLUMN IF EXISTS certificates,
        DROP COLUMN IF EXISTS custom_domain,
        DROP COLUMN IF EXISTS subdomain_included,
        DROP COLUMN IF EXISTS analytics,
        DROP COLUMN IF EXISTS branding,
        DROP COLUMN IF EXISTS support_level,
        DROP COLUMN IF EXISTS notes
    `);

    /* Re-add notes as a clean column (was TEXT nullable — keep it on plans) */
    await queryRunner.query(`
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS notes TEXT
    `);

    /* -----------------------------------------------------------------
       5. RLS on new tables (same pattern as existing tables)
    ----------------------------------------------------------------- */
    for (const table of ['plan_limits', 'plan_features']) {
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
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
    /* -----------------------------------------------------------------
       Reverse: restore old columns on plans from new tables, then drop new tables
    ----------------------------------------------------------------- */
    await queryRunner.query(`
      ALTER TABLE plans
        ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS student_limit INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS course_limit INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS video_limit INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS assignments_limit INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS materials_per_course INTEGER,
        ADD COLUMN IF NOT EXISTS admin_logins INTEGER,
        ADD COLUMN IF NOT EXISTS student_app_access VARCHAR,
        ADD COLUMN IF NOT EXISTS certificates VARCHAR,
        ADD COLUMN IF NOT EXISTS custom_domain VARCHAR,
        ADD COLUMN IF NOT EXISTS subdomain_included BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS analytics VARCHAR,
        ADD COLUMN IF NOT EXISTS branding VARCHAR,
        ADD COLUMN IF NOT EXISTS support_level VARCHAR
    `);

    // Restore data back (NULL → -1 for unlimited)
    await queryRunner.query(`
      UPDATE plans p SET
        storage_limit_mb = COALESCE(l.storage_mb, -1),
        student_limit     = COALESCE(l.student_limit, -1),
        course_limit      = COALESCE(l.course_limit, -1),
        video_limit       = COALESCE(l.video_limit, -1),
        assignments_limit = COALESCE(l.assignment_limit, -1),
        materials_per_course = COALESCE(l.materials_per_course, -1),
        admin_logins      = COALESCE(l.admin_logins, -1)
      FROM plan_limits l WHERE l.plan_id = p.id
    `);

    await queryRunner.query(`
      UPDATE plans p SET
        student_app_access = CASE WHEN f.student_app_access THEN 'Full Access' ELSE 'Limited' END,
        certificates       = f.certificates,
        custom_domain      = CASE WHEN f.custom_domain THEN 'Yes' ELSE 'No' END,
        subdomain_included = f.subdomain,
        analytics          = f.analytics,
        branding           = f.branding,
        support_level      = f.support_level
      FROM plan_features f WHERE f.plan_id = p.id
    `);

    for (const table of ['plan_limits', 'plan_features']) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS superadmin_full_access_${table} ON ${table}`,
      );
      await queryRunner.query(
        `ALTER TABLE IF EXISTS ${table} DISABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS ${table}`);
    }
  }
}

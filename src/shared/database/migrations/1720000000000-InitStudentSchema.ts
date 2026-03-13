import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitStudentSchema1720000000000 implements MigrationInterface {
  name = 'InitStudentSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // -------------------------------------------------------
    // ENUMS
    // -------------------------------------------------------
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE student_status_enum AS ENUM ('active', 'inactive');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE student_enrollment_status_enum AS ENUM ('active', 'completed', 'dropped');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE admission_status_enum AS ENUM ('pending', 'completed', 'expired', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // -------------------------------------------------------
    // STUDENTS
    // -------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID NOT NULL,
        name          VARCHAR(255) NOT NULL,
        email         VARCHAR(255) NOT NULL,
        phone         VARCHAR(20),
        parent_name   VARCHAR(255),
        profile_image TEXT,
        status        student_status_enum NOT NULL DEFAULT 'active',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`ALTER TABLE students ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE students FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      DROP POLICY IF EXISTS students_rls ON students;
      CREATE POLICY students_rls ON students
        USING (
          current_user_role() = 'SUPERADMIN'
          OR tenant_id = current_tenant_id()
        )
    `);

    // -------------------------------------------------------
    // STUDENT ENROLLMENTS
    // Named 'student_enrollments' to avoid conflict with the
    // existing superadmin 'enrollments' table.
    // -------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS student_enrollments (
        enrollment_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id         UUID NOT NULL,
        student_id        UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        course_id         INT NOT NULL,
        course_start_date DATE,
        status            student_enrollment_status_enum NOT NULL DEFAULT 'active',
        enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE student_enrollments FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      DROP POLICY IF EXISTS student_enrollments_rls ON student_enrollments;
      CREATE POLICY student_enrollments_rls ON student_enrollments
        USING (
          current_user_role() = 'SUPERADMIN'
          OR tenant_id = current_tenant_id()
        )
    `);

    // -------------------------------------------------------
    // STUDENT COURSE POINTS
    // -------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS student_course_points (
        points_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id               UUID NOT NULL,
        student_id              UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        course_id               INT NOT NULL,
        points_from_assignments INT NOT NULL DEFAULT 0,
        points_from_progress    INT NOT NULL DEFAULT 0,
        total_points            INT NOT NULL DEFAULT 0,
        levels                  INT NOT NULL DEFAULT 0,
        awards                  TEXT,
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`ALTER TABLE student_course_points ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE student_course_points FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      DROP POLICY IF EXISTS student_course_points_rls ON student_course_points;
      CREATE POLICY student_course_points_rls ON student_course_points
        USING (
          current_user_role() = 'SUPERADMIN'
          OR tenant_id = current_tenant_id()
        )
    `);

    // -------------------------------------------------------
    // ADMISSION LINKS
    // -------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admission_links (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID NOT NULL,
        created_by    UUID NOT NULL,
        student_email VARCHAR(255) NOT NULL,
        student_name  VARCHAR(255),
        course_id     INT,
        course_name   VARCHAR(255) NOT NULL,
        amount        NUMERIC(10, 2),
        token         VARCHAR(255) NOT NULL UNIQUE,
        expires_at    TIMESTAMPTZ NOT NULL,
        status        admission_status_enum NOT NULL DEFAULT 'pending',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at  TIMESTAMP
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_admission_links_tenant ON admission_links(tenant_id)`);
    await queryRunner.query(`ALTER TABLE admission_links ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE admission_links FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      DROP POLICY IF EXISTS admission_links_rls ON admission_links;
      CREATE POLICY admission_links_rls ON admission_links
        USING (
          current_user_role() = 'SUPERADMIN'
          OR tenant_id = current_tenant_id()
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS admission_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS student_course_points`);
    await queryRunner.query(`DROP TABLE IF EXISTS student_enrollments`);
    await queryRunner.query(`DROP TABLE IF EXISTS students`);
    await queryRunner.query(`DROP TYPE IF EXISTS admission_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS student_enrollment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS student_status_enum`);
  }
}

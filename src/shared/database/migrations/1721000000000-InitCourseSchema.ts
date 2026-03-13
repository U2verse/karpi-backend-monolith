import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCourseSchema1721000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── ENUMS ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE course_status_enum AS ENUM ('draft', 'published', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ── TABLES ────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL,
        title        VARCHAR NOT NULL,
        slug         VARCHAR NOT NULL,
        description  TEXT,
        thumbnail_url VARCHAR,
        status       course_status_enum NOT NULL DEFAULT 'draft',
        level        VARCHAR,
        language     VARCHAR,
        price        DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_by   UUID NOT NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT now(),
        updated_at   TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses(tenant_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_modules (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL,
        course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title        VARCHAR NOT NULL,
        order_index  INT NOT NULL DEFAULT 0,
        created_at   TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_course_modules_tenant ON course_modules(tenant_id, course_id);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL,
        module_id    UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
        course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title        VARCHAR NOT NULL,
        type         VARCHAR NOT NULL DEFAULT 'video',
        video_id     UUID,
        video_url    VARCHAR,
        content      TEXT,
        order_index  INT NOT NULL DEFAULT 0,
        created_at   TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_lessons_tenant ON lessons(tenant_id, course_id);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL,
        student_id   UUID NOT NULL,
        course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        is_active    BOOLEAN NOT NULL DEFAULT true,
        enrolled_at  TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_course_enrollments_tenant ON course_enrollments(tenant_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL,
        student_id   UUID NOT NULL,
        lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        completed    BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        status       VARCHAR NOT NULL DEFAULT 'NOT_STARTED'
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_lesson_progress_tenant ON lesson_progress(tenant_id, student_id, course_id);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_reviews (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL,
        course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id   UUID NOT NULL,
        rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review       TEXT,
        created_at   TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_course_reviews_tenant ON course_reviews(tenant_id, course_id);`);

    // ── RLS ───────────────────────────────────────────────────────────────
    for (const table of ['courses', 'course_modules', 'lessons', 'course_enrollments', 'lesson_progress', 'course_reviews']) {
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);

      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON ${table};`);
      await queryRunner.query(`
        CREATE POLICY tenant_isolation ON ${table}
        USING (
          current_user_role() = 'SUPERADMIN'
          OR tenant_id = current_tenant_id()
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['course_reviews', 'lesson_progress', 'course_enrollments', 'lessons', 'course_modules', 'courses']) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }
    await queryRunner.query(`DROP TYPE IF EXISTS course_status_enum;`);
  }
}

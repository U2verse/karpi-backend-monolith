import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitVideoSchema1741200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── ENUMS ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE video_status_enum AS ENUM ('uploaded', 'processing', 'ready', 'failed', 'replaced', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE video_visibility_enum AS ENUM ('public', 'private', 'unlisted');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ── VIDEOS ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id          UUID NOT NULL,
        course_id          UUID,
        lesson_id          UUID,
        title              TEXT NOT NULL,
        description        TEXT,
        uploaded_by        UUID NOT NULL,
        source_filename    TEXT,
        s3_key_prefix      TEXT NOT NULL,
        duration_seconds   INT NOT NULL DEFAULT 0,
        status             video_status_enum NOT NULL DEFAULT 'uploaded',
        size_bytes         BIGINT NOT NULL DEFAULT 0,
        visibility         video_visibility_enum NOT NULL DEFAULT 'private',
        default_variant_id UUID,
        created_at         TIMESTAMP NOT NULL DEFAULT now(),
        updated_at         TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_videos_tenant ON videos(tenant_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_videos_course ON videos(course_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_videos_lesson ON videos(lesson_id);`);

    // ── VIDEO VARIANTS ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS video_variants (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id       UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        variant_label  TEXT NOT NULL,
        s3_key         TEXT NOT NULL,
        mime_type      TEXT NOT NULL,
        width          INT,
        height         INT,
        bitrate_kbps   INT,
        size_bytes     BIGINT,
        codec          TEXT,
        created_at     TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_video_variants_video ON video_variants(video_id);`);

    // ── VIDEO THUMBNAILS ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS video_thumbnails (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        s3_key     TEXT NOT NULL,
        width      INT,
        height     INT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_video_thumbnails_video ON video_thumbnails(video_id);`);

    // ── VIDEO CAPTIONS ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS video_captions (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id       UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        language_code  VARCHAR(8) NOT NULL,
        s3_key         TEXT NOT NULL,
        format         TEXT NOT NULL,
        created_at     TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(video_id, language_code)
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_video_captions_video ON video_captions(video_id);`);

    // ── VIDEO ANALYTICS EVENTS ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS video_analytics_events (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id         UUID NOT NULL,
        tenant_id        UUID NOT NULL,
        user_id          UUID,
        event_type       TEXT NOT NULL,
        position_seconds INT,
        created_at       TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_video_analytics_video ON video_analytics_events(video_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_video_analytics_tenant ON video_analytics_events(tenant_id);`);

    // ── TENANT STORAGE ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_storage (
        tenant_id          UUID PRIMARY KEY,
        storage_used_bytes BIGINT NOT NULL DEFAULT 0,
        last_updated       TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS video_analytics_events CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS video_captions CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS video_thumbnails CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS video_variants CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS videos CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_storage CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS video_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS video_visibility_enum;`);
  }
}

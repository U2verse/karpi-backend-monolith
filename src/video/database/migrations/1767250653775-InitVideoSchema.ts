import { MigrationInterface, QueryRunner } from "typeorm";

export class InitVideoSchema1767250653775 implements MigrationInterface {
    name = 'InitVideoSchema1767250653775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."videos_status_enum" AS ENUM('uploaded', 'processing', 'ready', 'failed', 'replaced', 'archived')`);
        await queryRunner.query(`CREATE TYPE "public"."videos_visibility_enum" AS ENUM('public', 'private', 'unlisted')`);
        await queryRunner.query(`CREATE TABLE "videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "course_id" uuid, "lesson_id" uuid, "title" text NOT NULL, "description" text, "uploaded_by" uuid NOT NULL, "source_filename" text, "s3_key_prefix" text NOT NULL, "duration_seconds" integer NOT NULL DEFAULT '0', "status" "public"."videos_status_enum" NOT NULL DEFAULT 'uploaded', "size_bytes" bigint NOT NULL DEFAULT '0', "visibility" "public"."videos_visibility_enum" NOT NULL DEFAULT 'private', "default_variant_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4c86c0cf95aff16e9fb8220f6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d97c673372cd82feba22a5895b" ON "videos" ("lesson_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8f6e233979bc8acf49166c986f" ON "videos" ("course_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_05c7728c818cd1de06cab597ca" ON "videos" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "video_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "video_id" uuid NOT NULL, "variant_label" text NOT NULL, "s3_key" text NOT NULL, "mime_type" text NOT NULL, "width" integer, "height" integer, "bitrate_kbps" integer, "size_bytes" bigint, "codec" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_95914631094ec63dd9833e09a12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0bee89a64b95db23872b9a83c9" ON "video_variants" ("video_id") `);
        await queryRunner.query(`CREATE TABLE "video_captions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "video_id" uuid NOT NULL, "language_code" character varying(8) NOT NULL, "s3_key" text NOT NULL, "format" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_614f74775a7bf9475410f2763ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_87ab1bd5e38665cbc9f605bce2" ON "video_captions" ("video_id", "language_code") `);
        await queryRunner.query(`CREATE TABLE "video_thumbnails" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "video_id" uuid NOT NULL, "s3_key" text NOT NULL, "width" integer, "height" integer, "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9540a7e1a10bcaad41085ca7dca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7a2c45c1e61c548c0ed102ea95" ON "video_thumbnails" ("video_id") `);
        await queryRunner.query(`CREATE TABLE "tenant_storage" ("tenant_id" uuid NOT NULL, "storage_used_bytes" bigint NOT NULL DEFAULT '0', "last_updated" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_336a40ef3552746107aa5608ff2" PRIMARY KEY ("tenant_id"))`);
        await queryRunner.query(`CREATE TABLE "video_analytics_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "video_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "user_id" uuid, "event_type" text NOT NULL, "position_seconds" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3b218c66de92e281b9f13f2b4d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8869a9140de5023106c8062e8f" ON "video_analytics_events" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bb276f1b7223dc633d88046663" ON "video_analytics_events" ("video_id") `);
        await queryRunner.query(`ALTER TABLE "video_variants" ADD CONSTRAINT "FK_0bee89a64b95db23872b9a83c96" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "video_captions" ADD CONSTRAINT "FK_b803c8b816a4f5a05506134aafe" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "video_thumbnails" ADD CONSTRAINT "FK_7a2c45c1e61c548c0ed102ea950" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_thumbnails" DROP CONSTRAINT "FK_7a2c45c1e61c548c0ed102ea950"`);
        await queryRunner.query(`ALTER TABLE "video_captions" DROP CONSTRAINT "FK_b803c8b816a4f5a05506134aafe"`);
        await queryRunner.query(`ALTER TABLE "video_variants" DROP CONSTRAINT "FK_0bee89a64b95db23872b9a83c96"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb276f1b7223dc633d88046663"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8869a9140de5023106c8062e8f"`);
        await queryRunner.query(`DROP TABLE "video_analytics_events"`);
        await queryRunner.query(`DROP TABLE "tenant_storage"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a2c45c1e61c548c0ed102ea95"`);
        await queryRunner.query(`DROP TABLE "video_thumbnails"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87ab1bd5e38665cbc9f605bce2"`);
        await queryRunner.query(`DROP TABLE "video_captions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0bee89a64b95db23872b9a83c9"`);
        await queryRunner.query(`DROP TABLE "video_variants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05c7728c818cd1de06cab597ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f6e233979bc8acf49166c986f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d97c673372cd82feba22a5895b"`);
        await queryRunner.query(`DROP TABLE "videos"`);
        await queryRunner.query(`DROP TYPE "public"."videos_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."videos_status_enum"`);
    }

}

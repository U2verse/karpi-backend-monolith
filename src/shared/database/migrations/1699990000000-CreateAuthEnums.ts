import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthEnums1699990000000 implements MigrationInterface {
  name = "CreateAuthEnums1699990000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE users_role_enum AS ENUM (
            'student',
            'admin',
            'superadmin'
          );
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TYPE IF EXISTS users_role_enum;
    `);
  }
}

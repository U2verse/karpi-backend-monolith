import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientAdminRole1700003000000 implements MigrationInterface {
  name = "AddClientAdminRole1700003000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'clientadmin';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // To revert, recreate the type without 'clientadmin'.
    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN role TYPE varchar(50);
    `);
    await queryRunner.query(`DROP TYPE users_role_enum;`);
    await queryRunner.query(`
      CREATE TYPE users_role_enum AS ENUM ('student', 'admin', 'superadmin');
    `);
    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN role TYPE users_role_enum
        USING role::users_role_enum;
    `);
  }
}

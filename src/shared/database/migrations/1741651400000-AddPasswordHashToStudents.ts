import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordHashToStudents1741651400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE students DROP COLUMN IF EXISTS password_hash;
    `);
  }
}

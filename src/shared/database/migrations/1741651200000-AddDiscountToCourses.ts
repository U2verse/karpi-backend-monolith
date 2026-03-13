import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountToCourses1741651200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS discount NUMERIC(5, 2) NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE courses DROP COLUMN IF EXISTS discount;
    `);
  }
}

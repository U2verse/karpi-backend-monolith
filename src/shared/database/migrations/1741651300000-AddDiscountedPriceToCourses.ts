import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountedPriceToCourses1741651300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(10, 2)
        GENERATED ALWAYS AS (price * (1 - discount / 100)) STORED;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE courses DROP COLUMN IF EXISTS discounted_price;
    `);
  }
}

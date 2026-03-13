import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAdmissionLinksCreatedByNullable1722000000000 implements MigrationInterface {
  name = 'AlterAdmissionLinksCreatedByNullable1722000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE admission_links
        ALTER COLUMN created_by DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE admission_links
        ALTER COLUMN created_by SET NOT NULL
    `);
  }
}

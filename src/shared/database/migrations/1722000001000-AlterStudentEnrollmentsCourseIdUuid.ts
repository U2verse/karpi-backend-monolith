import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterStudentEnrollmentsCourseIdUuid1722000001000 implements MigrationInterface {
  name = 'AlterStudentEnrollmentsCourseIdUuid1722000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the NOT NULL + INT constraint and replace with UUID nullable
    await queryRunner.query(`
      ALTER TABLE student_enrollments
        ALTER COLUMN course_id DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE student_enrollments
        ALTER COLUMN course_id TYPE UUID USING NULL
    `);
    await queryRunner.query(`
      ALTER TABLE student_enrollments
        ALTER COLUMN course_id SET NOT NULL
    `);

    // Also fix admission_links.course_id from INT to UUID
    await queryRunner.query(`
      ALTER TABLE admission_links
        ALTER COLUMN course_id TYPE UUID USING NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE student_enrollments
        ALTER COLUMN course_id TYPE INT USING NULL
    `);
    await queryRunner.query(`
      ALTER TABLE admission_links
        ALTER COLUMN course_id TYPE INT USING NULL
    `);
  }
}

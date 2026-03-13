import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokenStudentSupport1741651500000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop FK so student UUIDs (not in users table) can be stored
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        DROP CONSTRAINT IF EXISTS fk_refresh_user
    `);

    // Allow user_id to be NULL (student tokens have no user_id)
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        ALTER COLUMN user_id DROP NOT NULL
    `);

    // Add student_id column with proper FK to students
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        ADD COLUMN IF NOT EXISTS student_id UUID NULL
          REFERENCES students(student_id) ON DELETE CASCADE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS student_id
    `);
    await queryRunner.query(`
      ALTER TABLE refresh_tokens ALTER COLUMN user_id SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        ADD CONSTRAINT fk_refresh_user
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    `);
  }
}

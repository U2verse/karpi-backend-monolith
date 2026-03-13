import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitesTable1741180000000 implements MigrationInterface {
  name = 'CreateInvitesTable1741180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invites (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token       VARCHAR(128) UNIQUE NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL,
        whatsapp    VARCHAR(50),
        plan_id     INTEGER REFERENCES plans(id) ON DELETE SET NULL,
        plan_name   VARCHAR(100),
        expires_at  TIMESTAMP NOT NULL,
        used_at     TIMESTAMP,
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS invites`);
  }
}

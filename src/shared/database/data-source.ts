import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: +(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl:
    process.env.SSL_MODE === 'require'
      ? { rejectUnauthorized: false }
      : false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/shared/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});

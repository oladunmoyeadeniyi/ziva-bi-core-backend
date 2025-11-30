import { DataSource } from 'typeorm';
import * as path from 'path';

/**
 * TypeORM configuration for NestJS + PostgreSQL
 * Works on local and on Render
 */

// Detect if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Require DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is missing in environment variables.');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,

  // SSL required by Render Postgres
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,

  // Load entity files (compiled JS in dist, TS in dev)
  entities: [
    path.join(__dirname, '/**/*.entity.{js,ts}')
  ],

  // Migration files
  migrations: [
    path.join(__dirname, '/migrations/**/*.{js,ts}')
  ],

  synchronize: false,  // never true in production
  logging: false,
});

export default AppDataSource;    

/**
 * TypeORM Configuration File
 * Production-ready for NestJS + PostgreSQL on Render.
 *
 * This file:
 * - Reads DATABASE_URL from environment variables
 * - Auto-loads all entities
 * - Uses migrations in /migrations folder
 * - Enables SSL for Render PostgreSQL
 */

import { DataSource } from 'typeorm';
import * as path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is missing.');
  throw new Error('DATABASE_URL environment variable not found.');
}

/**
 * Create the TypeORM data source
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,

  // Required for Render PostgreSQL
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,

  // Auto-load all entity files
  entities: [
    path.join(__dirname, '/**/*.entity.{ts,js}'),
  ],

  // Migration files (SQL OR JS)
  migrations: [
    path.join(__dirname, '/migrations/**/*.{ts,js}'),
  ],

  synchronize: false, // Never true in production!
  logging: false,
});

/**
 * Export as default so NestJS CLI can detect it
 */
export default AppDataSource;
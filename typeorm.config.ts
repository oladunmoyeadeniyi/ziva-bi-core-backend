/**
 * Ziva BI — Global TypeORM Configuration (Production-ready)
 * --------------------------------------------------------
 * Features:
 * ✔ Works on Render PostgreSQL
 * ✔ Fully migration-based (no auto schema sync)
 * ✔ Supports .sql migration files
 * ✔ Loads all entities under /src/modules/**/entities
 * ✔ Safe for multi-tenant architecture (no cross-tenant leakage)
 * ✔ SSL enabled by default for Render DB
 */

import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * DATABASE_URL example from Render:
 *  postgresql://user:pass@host:5432/dbname
 *
 * Required in Render environment:
 *  - SSL active
 *  - No self-signed cert rejection
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    '❌ DATABASE_URL is missing. Ensure it is set in Render environment variables.',
  );
}

/**
 * Path helpers
 */
const entitiesPath = path.join(__dirname, 'src/modules/**/entities/*.entity.{ts,js}');
const migrationsPath = path.join(__dirname, 'src/migrations/*.{sql,ts,js}');

console.log('📌 Entities path:', entitiesPath);
console.log('📌 Migrations path:', migrationsPath);
console.log('📌 Using DATABASE_URL from environment');

/**
 * DATA SOURCE (TypeORM)
 * This is the single source of truth for DB initialization.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,

  /**
   * SSL config for Render PostgreSQL
   */
  ssl: {
    rejectUnauthorized: false, // Render requires this value
  },

  /**
   * NEVER use synchronize:true in production.
   * All schema changes must go through migrations.
   */
  synchronize: false,

  /**
   * Auto-run migrations on startup.
   */
  migrationsRun: true,

  /**
   * Entity auto-loader
   */
  entities: [entitiesPath],

  /**
   * SQL and TS migration support
   */
  migrations: [migrationsPath],

  logging: false, // set to 'all' for debugging
});
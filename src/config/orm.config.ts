/**
 * orm.config.ts
 * -------------------------------------------
 * TypeORM configuration for Ziva BI Backend.
 * Loads connection from DATABASE_URL for Render.
 * -------------------------------------------
 */

import { DataSourceOptions } from 'typeorm';

export const ormConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,         // MUST REMAIN FALSE in production
  logging: false,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
};

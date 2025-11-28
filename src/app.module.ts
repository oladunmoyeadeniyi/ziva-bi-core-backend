/**
 * ================================================================
 * Ziva BI — AppModule (root NestJS module)
 * ----------------------------------------------------------------
 * This module wires up:
 *   - Controllers
 *   - Services
 *   - Future modules (Vendor, AP, AR, HR, Tax, etc.)
 * ================================================================
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { HealthController } from './controllers/health.controller';

// Entities
import { Tenant } from './modules/auth/entities/tenant.entity';
import { TenantSettings } from './modules/auth/entities/tenant-settings.entity';
import { User } from './modules/auth/entities/users.entity';
import { UserTenant } from './modules/auth/entities/user-tenants.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'zivabi',
      entities: [
        Tenant,
        TenantSettings,
        User,
        UserTenant,
      ],
      synchronize: false,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),

    TypeOrmModule.forFeature([
      Tenant,
      TenantSettings,
      User,
      UserTenant,
    ]),
  ],

  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
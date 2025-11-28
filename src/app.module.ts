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
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Change to false in production
      ssl: { rejectUnauthorized: false },
    }),
    AuthModule,
    RbacModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
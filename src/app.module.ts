/**
 * app.module.ts
 * -------------------------------------------
 * Root application module.
 * Loads global configuration and establishes DB connection.
 * More modules (Auth, RBAC, Tenants, etc.) will be added later.
 * -------------------------------------------
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from './config/orm.config';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ormConfig,
    }),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

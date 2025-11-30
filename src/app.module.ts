/**
 * Ziva BI — AppModule (Production-Ready)
 * --------------------------------------
 * This is the root NestJS module. It:
 *  - Loads database config via TypeORM
 *  - Registers all core infrastructure modules
 *  - Wires multi-tenant system (TenantModule + Users + RBAC)
 *  - Wires authentication system (AuthModule)
 *  - Enables global configuration loading
 *  - Ensures clean and scalable module architecture
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// -------------------------
// CORE MODULES
// -------------------------
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuthModule } from './modules/auth/auth.module';

// Health check controller
import { HealthController } from './health.controller';

// TypeORM configuration
import { AppDataSource } from '../typeorm.config';

@Module({
  imports: [
    // ------------------------------------------
    // 1. Load environment variables (.env)
    // ------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ------------------------------------------
    // 2. Database Initialization (TypeORM)
    // NOTE:
    //  - Migrations auto-run (configured in typeorm.config.ts)
    //  - Entities auto-loaded
    // ------------------------------------------
    TypeOrmModule.forRootAsync({
      useFactory: async () => AppDataSource.options as any,
    }),

    // ------------------------------------------
    // 3. Static Assets (optional for Frontend SSR)
    // ------------------------------------------
    // Uncomment if you need to serve frontend from Nest:
    /*
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),
    */

    // ------------------------------------------
    // 4. Ziva BI Core Infrastructure Modules
    // ------------------------------------------
    UsersModule,      // global user registry
    TenantsModule,    // multi-tenant administration
    RbacModule,       // roles + permissions
    AuthModule,       // authentication (JWT + refresh + sessions + OTP)

    // NOTE:
    // Additional modules will be added here:
    // - FileStorageModule
    // - OCRModule
    // - ExpenseModule
    // - AccountsPayableModule
    // - AccountsReceivableModule
    // - PayrollModule
    // - TaxEngineModule
    // - WarehouseModule
    // - POSMaterialModule
    // - BudgetModule
    // etc.
  ],

  controllers: [
    HealthController, // GET /api/health
  ],

  providers: [],
})
export class AppModule {}
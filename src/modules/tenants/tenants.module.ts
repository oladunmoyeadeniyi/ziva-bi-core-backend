/**
 * TenantsModule
 *
 * Purpose:
 *  - Registers all tenant-related providers (TenantService)
 *  - Registers controller (TenantController)
 *  - Exposes TenantService to other modules
 *  - Imports dependent modules (UsersModule, RbacModule)
 *  - Loads TypeORM repositories for Tenant, TenantModule, TenantSettings
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from './entities/tenant.entity';
import { TenantModule } from './entities/tenant-module.entity';
import { TenantSettings } from './entities/tenant-settings.entity';

import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';

import { UsersModule } from '../users/users.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    // Register database entities
    TypeOrmModule.forFeature([Tenant, TenantModule, TenantSettings]),

    // Required dependencies
    UsersModule, // needed to create initial admin or assign roles
    RbacModule,  // needed to create and assign tenant-admin role
  ],

  controllers: [TenantController],

  providers: [TenantService],

  // Export service so other modules (Auth, RBAC, etc.) can call tenantService
  exports: [TenantService],
})
export class TenantsModule {}
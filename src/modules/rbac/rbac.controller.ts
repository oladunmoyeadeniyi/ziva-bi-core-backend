import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';

import { RbacService } from './rbac.service';

import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';

import { RbacController } from './rbac.controller';

/**
 * RBAC MODULE
 * -------------------------
 * This module bundles all role-based access control components:
 *  - Entities: Role, Permission, RolePermission, UserRole
 *  - RBAC Service: handles creation, linking, validation
 *  - Guards: PermissionsGuard & RolesGuard for route protection
 *  - Controller: exposes API endpoints for tenant admins
 *
 * This module becomes globally usable once exported from AppModule.
 */

@Module({
  imports: [
    /**
     * Registers RBAC-related database tables with TypeORM.
     * TypeORM will auto-sync these entities into PostgreSQL.
     */
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      UserRole,
    ]),
  ],

  controllers: [
    /**
     * Exposes secure endpoints such as:
     *  - POST /rbac/roles
     *  - POST /rbac/permissions
     *  - POST /rbac/roles/:id/permissions
     *  - POST /rbac/users/:id/roles
     */
    RbacController,
  ],

  providers: [
    /**
     * Core RBAC Logic:
     *  - Creating roles
     *  - Creating permissions
     *  - Mapping permissions to roles
     *  - Mapping roles to users
     */
    RbacService,

    /**
     * Protects routes using:
     *  - @Permissions()
     *  - @Roles() [optional extension]
     */
    PermissionsGuard,
    RolesGuard,
  ],

  exports: [
    /**
     * These exports allow other modules (AP, Expense, Vendor Onboarding)
     * to enforce permissions on their routes.
     */
    RbacService,
    PermissionsGuard,
    RolesGuard,
  ],
})
export class RbacModule {}
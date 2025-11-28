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
import { AuditModule } from '../audit/audit.module';

/**
 * RBAC MODULE
 * -------------------------
 * Registers entities, controller, guards and the RBAC service.
 * Now imports AuditModule so RBAC actions are logged.
 */

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole]),
    AuditModule,
  ],
  controllers: [RbacController],
  providers: [RbacService, PermissionsGuard, RolesGuard],
  exports: [RbacService, PermissionsGuard, RolesGuard],
})
export class RbacModule {}
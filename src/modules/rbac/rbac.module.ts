/**
 * RbacModule
 *
 * Provides:
 *  - RbacService
 *  - RbacController
 *  - RbacGuard (exported for global usage)
 *  - Decorator for permissions
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';

import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { RbacGuard } from './rbac.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole]),
  ],
  controllers: [RbacController],
  providers: [RbacService, RbacGuard],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}
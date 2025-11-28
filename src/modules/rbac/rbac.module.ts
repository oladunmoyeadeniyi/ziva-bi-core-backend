// src/modules/rbac/rbac.module.ts
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

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole])],
  providers: [RbacService, PermissionsGuard, RolesGuard],
  controllers: [RbacController],
  exports: [RbacService, PermissionsGuard, RolesGuard],
})
export class RbacModule {}
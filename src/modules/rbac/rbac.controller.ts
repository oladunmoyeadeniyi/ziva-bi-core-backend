/**
 * RBAC Controller
 *
 * Purpose:
 *   System-wide endpoint to create and manage roles & permissions.
 *
 * IMPORTANT:
 *   In production, all routes here must be SUPER_ADMIN restricted.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';

import { RbacService } from './rbac.service';
import { RequirePermissions } from './rbac.decorator';

@Controller('api/rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // --------------------------
  // Role creation
  // --------------------------
  @Post('roles')
  async createRole(@Body() body: { name: string; description?: string }) {
    if (!body.name) throw new BadRequestException('Role name required');
    const role = await this.rbacService.createRole(body.name, body.description);
    return { success: true, data: role };
  }

  // --------------------------
  // Permission creation
  // --------------------------
  @Post('permissions')
  async createPermission(@Body() body: { key: string; description?: string }) {
    if (!body.key) throw new BadRequestException('Permission key required');
    const perm = await this.rbacService.createPermission(body.key, body.description);
    return { success: true, data: perm };
  }

  // --------------------------
  // Assign permission → role
  // --------------------------
  @Post('roles/:roleId/permissions')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Body() body: { permission_id: string },
  ) {
    const rp = await this.rbacService.assignPermissionToRole(
      roleId,
      body.permission_id,
    );
    return { success: true, data: rp };
  }

  // --------------------------
  // Assign role → userTenant
  // --------------------------
  @Post('assign-role')
  async assignRole(
    @Body() body: { user_tenant_id: string; role_id: string; assigned_by?: string },
  ) {
    if (!body.user_tenant_id || !body.role_id)
      throw new BadRequestException('user_tenant_id and role_id required');

    const ur = await this.rbacService.assignRoleToUser(
      body.user_tenant_id,
      body.role_id,
      body.assigned_by,
    );

    return { success: true, data: ur };
  }

  // --------------------------
  // List permissions → user
  // --------------------------
  @Get('user/:userTenantId/permissions')
  async listPermissions(@Param('userTenantId') userTenantId: string) {
    const perms = await this.rbacService.getUserPermissions(userTenantId);
    return { success: true, data: perms };
  }
}
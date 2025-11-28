import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Post('roles')
  async createRole(@Body() dto: { name: string; description?: string }) {
    return this.rbac.createRole(dto.name, dto.description);
  }

  @Post('permissions')
  async createPermission(@Body() dto: { key: string; description?: string }) {
    return this.rbac.createPermission(dto.key, dto.description);
  }

  @Post('roles/:roleId/permissions')
  async assignPermission(
    @Param('roleId') roleId: string,
    @Body() dto: { permissionId: string }
  ) {
    return this.rbac.assignPermissionToRole(roleId, dto.permissionId);
  }

  @Post('users/:userTenantId/roles')
  async assignRole(
    @Param('userTenantId') userTenantId: string,
    @Body() dto: { roleId: string }
  ) {
    return this.rbac.assignRoleToUser(userTenantId, dto.roleId);
  }
}
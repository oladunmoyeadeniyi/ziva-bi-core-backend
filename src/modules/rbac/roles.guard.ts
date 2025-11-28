// src/modules/rbac/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';

export const ROLES_KEY = 'required_roles';
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Use: @UseGuards(JwtAuthGuard, RolesGuard) @Roles('finance_manager')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbac: RbacService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Unauthenticated');
    const userTenantId = user.sub || user.userTenantId || user.user_tenant_id;
    if (!userTenantId) throw new ForbiddenException('Invalid user payload');

    for (const r of required) {
      const ok = await this.rbac.userHasRole(userTenantId, r);
      if (!ok) throw new ForbiddenException(`Missing role: ${r}`);
    }
    return true;
  }
}
// src/modules/rbac/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { RbacService } from './rbac.service';

/**
 * PermissionsGuard should be used after authentication guard.
 * Example usage:
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @Permissions('expenses.create')
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbac: RbacService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true; // no permission required

    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // JWT guard should populate req.user

    if (!user) throw new ForbiddenException('Unauthenticated');

    // user.sub expected to be user_tenant_id
    const userTenantId = user.sub || user.userTenantId || user.user_tenant_id;
    if (!userTenantId) throw new ForbiddenException('Invalid user payload');

    // check each required permission (all must be present)
    for (const perm of required) {
      const ok = await this.rbac.userHasPermission(userTenantId, perm);
      if (!ok) throw new ForbiddenException(`Missing permission: ${perm}`);
    }

    return true;
  }
}
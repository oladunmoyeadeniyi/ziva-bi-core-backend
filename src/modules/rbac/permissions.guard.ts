import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

/**
 * PERMISSIONS GUARD
 * ---------------------------------------------------------
 * This guard blocks route access unless a user has the proper
 * permission key(s). It works together with:
 *
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)
 *   @Permissions('expenses.create')
 *
 * This ensures clean, secure, enterprise-grade RBAC.
 *
 * What this guard enforces:
 *  1. User must be authenticated
 *  2. User must belong to the tenant of the request
 *  3. Required permissions must be assigned to their roles
 *  4. Super Admin can bypass all permissions
 *  5. Future-ready for module-subscription checks
 */

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract permissions required by the route handler.
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // If the route requires no permissions, allow access.
    if (requiredPermissions.length === 0) {
      return true;
    }

    // Retrieve authenticated user object from request (injected by JwtAuthGuard).
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated.');
    }

    const { userId, tenantId, roles, isSuperAdmin } = user;

    // SUPER ADMIN BYPASS
    if (isSuperAdmin === true) {
      return true;
    }

    // VALIDATE TENANT CONTEXT
    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing.');
    }

    // LOAD USER PERMISSIONS FROM DATABASE
    const userPermissions = await this.rbacService.getUserPermissions(
      userId,
      tenantId,
    );

    // If user has no permissions assigned
    if (!userPermissions || userPermissions.length === 0) {
      throw new ForbiddenException(
        'You do not have permissions to access this resource.',
      );
    }

    // PERMISSION MATCH CHECK
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
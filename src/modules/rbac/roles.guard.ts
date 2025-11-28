import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * ROLES GUARD
 * ---------------------------------------------------------
 * This guard checks whether the authenticated user has one
 * of the required roles for a route.
 *
 * Usage:
 *    @UseGuards(JwtAuthGuard, RolesGuard)
 *    @Roles('finance_manager', 'tenant_admin')
 *
 * This guard is OPTIONAL and works best alongside PermissionsGuard.
 */

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ROLES REQUIRED BY THE ROUTE
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // If no roles required → allow
    if (requiredRoles.length === 0) {
      return true;
    }

    // Authenticated user object (populated by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const { roles, isSuperAdmin } = user;

    // SUPER ADMIN BYPASSES ROLE CHECK
    if (isSuperAdmin) {
      return true;
    }

    // If user has no roles at all
    if (!roles || roles.length === 0) {
      throw new ForbiddenException('You have no assigned roles');
    }

    // Check if user has AT LEAST one required role
    const hasRole = requiredRoles.some((requiredRole) =>
      roles.includes(requiredRole),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Missing required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
/**
 * RBAC Guard
 *
 * - Extracts userTenantId from request (set by AuthGuard once implemented)
 * - Loads permissions from RbacService
 * - Compares required permissions from decorator
 *
 * NOTE:
 *   For now, userTenantId is hardcoded as a placeholder (demo mode).
 *   When Auth module is finished, we will extract from JWT.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Reflector,
} from '@nestjs/common';

import { RbacService } from './rbac.service';
import { REQUIRE_PERMISSIONS_KEY } from './rbac.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No permissions required → allow
      return true;
    }

    const request = context.switchToHttp().getRequest();

    /**
     * TODO (after Auth module is live):
     *   const userTenantId = request.user.userTenantId;
     *
     * Demo: allow temporary override for testing.
     */
    const userTenantId =
      request.headers['x-user-tenant-id'] ||
      request.query['userTenantId'] ||
      request.body['userTenantId'];

    if (!userTenantId) {
      throw new ForbiddenException(
        'Missing userTenantId. Provide via header x-user-tenant-id for now.',
      );
    }

    // Fetch permissions from RBAC service
    const userPerms = await this.rbacService.getUserPermissions(String(userTenantId));

    for (const perm of requiredPermissions) {
      if (!userPerms.includes(perm)) {
        throw new ForbiddenException(
          `You lack required permission: ${perm}. You have: ${userPerms.join(', ')}`,
        );
      }
    }

    return true;
  }
}
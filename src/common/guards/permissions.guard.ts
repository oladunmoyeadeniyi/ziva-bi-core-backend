/**
 * PermissionsGuard
 *
 * Enforces RBAC at the route level.
 * Requires:
 *  - JwtAuthGuard to have set req.user
 *  - RbacService to fetch permissions
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RbacService } from '../../modules/rbac/rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const perm = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
    if (!perm) return true; // no permission required

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const has = await this.rbacService.userHasPermission(user.id, perm);

    if (!has) {
      throw new ForbiddenException(`Missing required permission: ${perm}`);
    }

    return true;
  }
}
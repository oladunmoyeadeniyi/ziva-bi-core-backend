// permissions.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * PermissionsGuard reads required permissions from the route (metadata)
 * and verifies the user's permissions array included in JWT payload.
 *
 * Usage:
 * - Create a custom decorator `@Permissions('can_approve')` that sets metadata.
 * - Add guard globally or on protected routes.
 *
 * This implementation assumes JWT payload included `permissions` list.
 */

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.permissions) return false;

    return required.every((r) => user.permissions.includes(r));
  }
}
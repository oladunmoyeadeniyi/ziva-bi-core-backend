/**
 * Custom decorator for declaring required permissions on a route.
 * Works together with PermissionsGuard to enforce RBAC rules.
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
/**
 * RBAC Decorator
 *
 * Usage:
 *    @RequirePermissions("ap.approve", "expenses.review")
 *    someMethod() {}
 *
 * This attaches the permission keys to route metadata.
 */

import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
import { SetMetadata } from '@nestjs/common';

/**
 * PERMISSIONS KEY
 * ---------------------------------------------------------
 * Used for storing metadata on route handlers and controllers.
 * PermissionsGuard will later read this metadata to verify
 * whether the user has the required permissions.
 */
export const PERMISSIONS_KEY = 'permissions_required';

/**
 * @Permissions Decorator
 * ---------------------------------------------------------
 * Usage example:
 *
 *     @Permissions(
 *        'expense.create',
 *        'expense.view',
 *        'ap.vendor.approve'
 *     )
 *
 * Attaches an array of permission keys to the route metadata.
 *
 * These keys are later fetched using Nest's Reflector inside
 * PermissionsGuard to enforce access control.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

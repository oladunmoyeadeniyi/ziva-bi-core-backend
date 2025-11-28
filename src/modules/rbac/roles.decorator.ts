import { SetMetadata } from '@nestjs/common';

/**
 * ROLES KEY
 * ---------------------------------------------------------
 * Metadata key used by NestJS Reflector inside RolesGuard.
 * This key stores an array of required roles for a route.
 *
 * Example:
 *    @Roles('finance_manager', 'tenant_admin')
 */
export const ROLES_KEY = 'roles_required';

/**
 * @Roles Decorator
 * ---------------------------------------------------------
 * Decorator for specifying which roles are allowed to access
 * a particular route or controller.
 *
 * Usage Example:
 *
 *    @UseGuards(JwtAuthGuard, RolesGuard)
 *    @Roles('super_admin', 'tenant_admin')
 *    @Get('dashboard')
 *    getAdminDashboard() { ... }
 *
 * The RolesGuard will then extract this metadata and check
 * if the authenticated user has at least one of the roles.
 */
export const Roles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * src/modules/rbac/rbac.types.ts
 *
 * Centralized RBAC Type Definitions
 *
 * Purpose:
 * - Provide consistent TypeScript interfaces and DTOs for the RBAC module.
 * - Used by services, controllers, and the front-end (via API docs / generated clients).
 * - Keep the shape of role/permission-related payloads explicit and self-documented.
 *
 * NOTE:
 * - These are plain TypeScript types / interfaces (no decorators).
 * - DTOs are lightweight — validation (class-validator) is applied in DTO classes if you choose to convert.
 */

/* -------------------------------------------------------------------------- */
/*                                  Entities                                   */
/* -------------------------------------------------------------------------- */

/**
 * Role entity shape (database-backed).
 * Mirrors columns on the `roles` table.
 */
export interface RoleView {
  id: string; // UUID
  name: string; // e.g. "finance_manager"
  description?: string | null;
  is_active: boolean;
  created_at: string; // ISO datetime
  updated_at?: string | null; // ISO datetime
}

/**
 * Permission entity shape (database-backed).
 * Mirrors columns on the `permissions` table.
 */
export interface PermissionView {
  id: string; // UUID
  key: string; // e.g. "expenses.create"
  description?: string | null;
  is_active: boolean;
  created_at: string; // ISO datetime
  updated_at?: string | null; // ISO datetime
}

/**
 * RolePermission (link table) representation
 */
export interface RolePermissionView {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

/**
 * UserRole (link table) representation
 */
export interface UserRoleView {
  id: string;
  user_tenant_id: string; // the user within a tenant scope
  role_id: string;
  assigned_by?: string | null;
  assigned_at: string;
}

/* -------------------------------------------------------------------------- */
/*                                   DTOs                                      */
/* -------------------------------------------------------------------------- */

/**
 * Create Role Request
 */
export interface CreateRoleDTO {
  name: string;
  description?: string;
}

/**
 * Create Permission Request
 */
export interface CreatePermissionDTO {
  key: string;
  description?: string;
}

/**
 * Assign Permission to Role Request
 */
export interface AssignPermissionToRoleDTO {
  permissionId: string;
}

/**
 * Assign multiple Permissions to Role (bulk)
 */
export interface AssignPermissionsToRoleDTO {
  permissionIds: string[];
}

/**
 * Assign Role to User Request
 */
export interface AssignRoleToUserDTO {
  roleId: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Response Shapes                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard response when creating a Role
 */
export interface CreateRoleResponse {
  role: RoleView;
  message?: string;
}

/**
 * Standard response when creating a Permission
 */
export interface CreatePermissionResponse {
  permission: PermissionView;
  message?: string;
}

/**
 * Generic success response (used for assignments)
 */
export interface SuccessResponse {
  success: true;
  message?: string;
}

/**
 * Paginated listing for roles / permissions (minimal)
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedRoles {
  data: RoleView[];
  meta: PaginationMeta;
}

export interface PaginatedPermissions {
  data: PermissionView[];
  meta: PaginationMeta;
}

/* -------------------------------------------------------------------------- */
/*                             Runtime / Guard Interfaces                      */
/* -------------------------------------------------------------------------- */

/**
 * Authenticated user object shape (what JwtAuthGuard places on request.user)
 * NOTE: keep in sync with your auth.service token payload
 */
export interface AuthenticatedUser {
  userId: string; // user PK
  userTenantId?: string; // user-tenant PK (if your model uses it)
  tenantId?: string; // tenant PK (organization)
  email?: string;
  name?: string;
  roles?: string[]; // role names e.g. ['finance_manager']
  isSuperAdmin?: boolean; // true to bypass RBAC checks
  // any other fields you attach to the JWT payload
  [k: string]: any;
}

/**
 * Shape returned by RbacService.getUserPermissions
 */
export type UserPermissionKeys = string[]; // e.g. ['expenses.create','ap.approve']

/* -------------------------------------------------------------------------- */
/*                          Admin UI / Bulk Operations                         */
/* -------------------------------------------------------------------------- */

/**
 * RBAC Template (useful for tenant onboarding)
 * - name: template name
 * - roleIds: list of roles to create or map
 * - permissionKeys: list of permission keys to assign into a role mapping
 */
export interface RbacTemplate {
  name: string;
  description?: string;
  roles: {
    name: string;
    description?: string;
    permissionKeys?: string[]; // keys to map to this role
  }[];
}

/* -------------------------------------------------------------------------- */
/*                               Helper Types                                  */
/* -------------------------------------------------------------------------- */

/**
 * Basic ID wrapper used for simple success responses
 */
export interface IdResponse {
  id: string;
  message?: string;
}
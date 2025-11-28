// src/modules/rbac/rbac.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';

/**
 * RBAC SERVICE
 *
 * Responsibilities:
 * - CRUD helpers for Role and Permission entities
 * - Assign/Unassign Role <-> Permission and User <-> Role
 * - Resolve effective permissions for a user (tenant-aware)
 * - Helper boolean checks: userHasPermission, userHasRole
 *
 * Notes:
 * - This service expects `userTenantId` to represent the user in the scope of a tenant.
 *   That is typically the primary key for user_tenants (the row that connects a user to a tenant).
 * - For multi-tenant isolation: if tenantId is supplied to permission resolution, the
 *   service will (optionally) filter roles/permissions by tenant scope if/when we extend schema.
 *   Current entities are global; if you want tenant-scoped roles/permissions, we'll add tenant_id columns.
 */
@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  // ---------------------------
  // ADMIN HELPERS - CREATE / FIND
  // ---------------------------

  /**
   * Create or return an existing role by name.
   * @param name Example: "finance_manager"
   * @param description Optional description
   */
  async createRole(name: string, description?: string): Promise<Role> {
    if (!name || name.trim() === '') {
      throw new BadRequestException('Role name is required');
    }
    const existing = await this.roleRepo.findOne({ where: { name } });
    if (existing) return existing;
    const role = this.roleRepo.create({ name, description });
    return this.roleRepo.save(role);
  }

  /**
   * Create or return an existing permission by key.
   * @param key Example: "expenses.create"
   */
  async createPermission(key: string, description?: string): Promise<Permission> {
    if (!key || key.trim() === '') {
      throw new BadRequestException('Permission key is required');
    }
    const existing = await this.permRepo.findOne({ where: { key } });
    if (existing) return existing;
    const perm = this.permRepo.create({ key, description });
    return this.permRepo.save(perm);
  }

  /**
   * Find role by id
   */
  async findRoleById(roleId: string): Promise<Role | null> {
    if (!roleId) return null;
    return this.roleRepo.findOne({ where: { id: roleId } });
  }

  /**
   * Find permission by id
   */
  async findPermissionById(permissionId: string): Promise<Permission | null> {
    if (!permissionId) return null;
    return this.permRepo.findOne({ where: { id: permissionId } });
  }

  /**
   * Find permission by key
   */
  async findPermissionByKey(key: string): Promise<Permission | null> {
    if (!key) return null;
    return this.permRepo.findOne({ where: { key } });
  }

  // --------------------------------
  // ASSIGNMENTS: ROLE <-> PERMISSION
  // --------------------------------

  /**
   * Assign a permission to a role.
   * If mapping exists, returns the existing mapping.
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    if (!roleId || !permissionId) {
      throw new BadRequestException('roleId and permissionId are required');
    }

    // Confirm role & permission exist
    const [role, permission] = await Promise.all([
      this.roleRepo.findOne({ where: { id: roleId } }),
      this.permRepo.findOne({ where: { id: permissionId } }),
    ]);
    if (!role) throw new NotFoundException('Role not found');
    if (!permission) throw new NotFoundException('Permission not found');

    const existing = await this.rolePermRepo.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });

    if (existing) return existing;

    const rp = this.rolePermRepo.create({
      role_id: roleId,
      permission_id: permissionId,
    });
    return this.rolePermRepo.save(rp);
  }

  /**
   * Bulk assign permissions to a role (useful for templates)
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<RolePermission[]> {
    if (!roleId || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      throw new BadRequestException('roleId and permissionIds are required');
    }

    // Validate role exists
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // Deduplicate and filter out existing mappings
    const distinctPermissionIds = Array.from(new Set(permissionIds));
    const existingRps = await this.rolePermRepo.find({
      where: { role_id: roleId, permission_id: In(distinctPermissionIds) },
    });
    const existingPermIds = existingRps.map((r) => r.permission_id);
    const toCreate = distinctPermissionIds.filter((id) => !existingPermIds.includes(id));

    const created: RolePermission[] = [];
    for (const permId of toCreate) {
      // Optionally ensure permission exists (skip if not)
      const permExists = await this.permRepo.findOne({ where: { id: permId } });
      if (!permExists) continue;
      const rp = this.rolePermRepo.create({ role_id: roleId, permission_id: permId });
      created.push(await this.rolePermRepo.save(rp));
    }

    return created.concat(existingRps);
  }

  // ------------------------------
  // ASSIGNMENTS: USER <-> ROLE
  // ------------------------------

  /**
   * Assign role to a user (userTenantId).
   * userTenantId represents the user within a tenant context.
   * assignedBy is optional (who performed the assignment).
   */
  async assignRoleToUser(userTenantId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    if (!userTenantId || !roleId) {
      throw new BadRequestException('userTenantId and roleId are required');
    }

    // Validate role exists
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // Avoid duplicate assignments
    const existing = await this.userRoleRepo.findOne({
      where: { user_tenant_id: userTenantId, role_id: roleId },
    });
    if (existing) return existing;

    const ur = this.userRoleRepo.create({
      user_tenant_id: userTenantId,
      role_id: roleId,
      assigned_by: assignedBy,
      assigned_at: new Date(),
    });
    return this.userRoleRepo.save(ur);
  }

  /**
   * Remove a role from a user (soft remove possible in future).
   */
  async removeRoleFromUser(userTenantId: string, roleId: string): Promise<void> {
    if (!userTenantId || !roleId) return;
    await this.userRoleRepo.delete({ user_tenant_id: userTenantId, role_id: roleId });
  }

  // ----------------------------------------
  // PERMISSION RESOLUTION / EFFECTIVE PERMS
  // ----------------------------------------

  /**
   * Get effective permissions (keys) for a user.
   *
   * Returns a string array of permission keys: ['expenses.create','ap.approve', ...]
   *
   * Implementation:
   *  1) Get roles assigned to the user (user_roles)
   *  2) Get role_permissions for those role ids
   *  3) Get permission keys for those permission ids
   *
   * Params:
   *  - userTenantId: the user_tenant identity
   *  - tenantId (optional): for future tenant-scoped roles/permissions filtering
   */
  async getUserPermissions(userTenantId: string, tenantId?: string): Promise<string[]> {
    if (!userTenantId) return [];

    // Step 1: user roles
    const userRoles = await this.userRoleRepo.find({
      where: { user_tenant_id: userTenantId },
    });

    if (!userRoles || userRoles.length === 0) return [];

    const roleIds = Array.from(new Set(userRoles.map((r) => r.role_id)));
    if (roleIds.length === 0) return [];

    // Step 2: role -> role_permissions
    const rolePerms = await this.rolePermRepo.find({
      where: { role_id: In(roleIds) },
    });
    if (!rolePerms || rolePerms.length === 0) return [];

    const permIds = Array.from(new Set(rolePerms.map((rp) => rp.permission_id)));
    if (permIds.length === 0) return [];

    // Step 3: fetch permission keys
    const perms = await this.permRepo.find({
      where: { id: In(permIds), is_active: true },
    });

    const keys = perms.map((p) => p.key);
    return Array.from(new Set(keys));
  }

  /**
   * Convenience: return permission entities for a user.
   */
  async getUserPermissionEntities(userTenantId: string): Promise<Permission[]> {
    if (!userTenantId) return [];
    const keys = await this.getUserPermissions(userTenantId);
    if (!keys || keys.length === 0) return [];
    // fetch full entities by key
    return this.permRepo.find({ where: { key: In(keys) } });
  }

  // ----------------------
  // BOOLEAN HELPER CHECKS
  // ----------------------

  /**
   * Check if the user has a specific permission (by key).
   */
  async userHasPermission(userTenantId: string, permissionKey: string): Promise<boolean> {
    if (!userTenantId || !permissionKey) return false;
    // Short-circuit: if permission doesn't exist => false
    const perm = await this.permRepo.findOne({ where: { key: permissionKey } });
    if (!perm) return false;

    // Efficient check: find role_ids for user, then check role_permissions
    const userRoles = await this.userRoleRepo.find({ where: { user_tenant_id: userTenantId } });
    if (!userRoles || userRoles.length === 0) return false;

    const roleIds = userRoles.map((r) => r.role_id);
    const rp = await this.rolePermRepo.findOne({
      where: { role_id: In(roleIds), permission_id: perm.id },
    });
    return !!rp;
  }

  /**
   * Check if the user has a role with given name.
   * This will fetch the user's assigned roles and check the names.
   */
  async userHasRole(userTenantId: string, roleName: string): Promise<boolean> {
    if (!userTenantId || !roleName) return false;

    const userRoles = await this.userRoleRepo.find({ where: { user_tenant_id: userTenantId } });
    if (!userRoles || userRoles.length === 0) return false;
    const roleIds = userRoles.map((r) => r.role_id);
    if (roleIds.length === 0) return false;

    const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });
    return roles.some((r) => r.name === roleName && r.is_active);
  }

  // ----------------------
  // ADMIN / UTILITY HELPERS
  // ----------------------

  /**
   * Get roles assigned to a user (returns role entities).
   */
  async getRolesForUser(userTenantId: string): Promise<Role[]> {
    if (!userTenantId) return [];
    const userRoles = await this.userRoleRepo.find({ where: { user_tenant_id: userTenantId } });
    if (!userRoles || userRoles.length === 0) return [];
    const roleIds = userRoles.map((r) => r.role_id);
    if (roleIds.length === 0) return [];
    return this.roleRepo.find({ where: { id: In(roleIds), is_active: true } });
  }

  /**
   * Search permissions by partial key (useful for admin UI autocomplete)
   */
  async searchPermissions(partialKey: string, limit = 25): Promise<Permission[]> {
    if (!partialKey) {
      return this.permRepo.find({ take: limit });
    }
    return this.permRepo
      .createQueryBuilder('p')
      .where('p.key ILIKE :q', { q: `%${partialKey}%` })
      .limit(limit)
      .getMany();
  }
}
// src/modules/rbac/rbac.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  // Create/find roles & permissions (admin usage)
  async createRole(name: string, description?: string) {
    let r = await this.roleRepo.findOne({ where: { name } });
    if (r) return r;
    r = this.roleRepo.create({ name, description });
    return this.roleRepo.save(r);
  }

  async createPermission(key: string, description?: string) {
    let p = await this.permRepo.findOne({ where: { key } });
    if (p) return p;
    p = this.permRepo.create({ key, description });
    return this.permRepo.save(p);
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    const existing = await this.rolePermRepo.findOne({ where: { role_id: roleId, permission_id: permissionId } });
    if (existing) return existing;
    const rp = this.rolePermRepo.create({ role_id: roleId, permission_id: permissionId });
    return this.rolePermRepo.save(rp);
  }

  async assignRoleToUser(userTenantId: string, roleId: string, assignedBy?: string) {
    const existing = await this.userRoleRepo.findOne({ where: { user_tenant_id: userTenantId, role_id: roleId } });
    if (existing) return existing;
    const ur = this.userRoleRepo.create({ user_tenant_id: userTenantId, role_id: roleId, assigned_by: assignedBy });
    return this.userRoleRepo.save(ur);
  }

  async getRolesForUser(userTenantId: string) {
    const ur = await this.userRoleRepo.find({ where: { user_tenant_id: userTenantId } });
    if (!ur || ur.length === 0) return [];
    const roleIds = ur.map(r => r.role_id);
    const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });
    return roles;
  }

  async getPermissionsForUser(userTenantId: string) {
    // 1) get roles
    const ur = await this.userRoleRepo.find({ where: { user_tenant_id: userTenantId } });
    if (!ur || ur.length === 0) return [];
    const roleIds = ur.map(r => r.role_id);

    // 2) get role_permissions
    const rps = await this.rolePermRepo.find({ where: { role_id: In(roleIds) } });
    if (!rps || rps.length === 0) return [];

    const permIds = Array.from(new Set(rps.map(x => x.permission_id)));
    const perms = await this.permRepo.find({ where: { id: In(permIds) } });
    return perms;
  }

  // Helper: check if user has permission key
  async userHasPermission(userTenantId: string, permissionKey: string) {
    const perms = await this.getPermissionsForUser(userTenantId);
    return perms.some(p => p.key === permissionKey && p.is_active);
  }

  // Helper: check if user has a role
  async userHasRole(userTenantId: string, roleName: string) {
    const roles = await this.getRolesForUser(userTenantId);
    return roles.some(r => r.name === roleName && r.is_active);
  }

  // admin helpers
  async findRoleByName(name: string) {
    return this.roleRepo.findOne({ where: { name } });
  }

  async findPermissionByKey(key: string) {
    return this.permRepo.findOne({ where: { key } });
  }
}
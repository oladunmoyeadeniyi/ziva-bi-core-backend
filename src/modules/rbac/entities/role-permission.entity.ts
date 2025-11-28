// src/modules/rbac/entities/role-permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity({ name: 'role_permissions' })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_id' })
  role_id: string;

  @Column({ name: 'permission_id' })
  permission_id: string;

  // Optional relations for ease of joining (not required)
  @ManyToOne(() => Role) @JoinColumn({ name: 'role_id' }) role?: Role;
  @ManyToOne(() => Permission) @JoinColumn({ name: 'permission_id' }) permission?: Permission;
}
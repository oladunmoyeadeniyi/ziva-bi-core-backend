// src/modules/rbac/entities/user-role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'user_roles' })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_tenant_id' })
  user_tenant_id: string; // FK to user_tenants.id

  @Column({ name: 'role_id' })
  role_id: string;

  @Column({ name: 'assigned_by', nullable: true })
  assigned_by?: string; // user_tenant_id who assigned

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  assigned_at: Date;
}
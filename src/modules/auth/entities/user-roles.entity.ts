/**
 * user-roles.entity.ts
 *
 * Maps a tenant user to one or more roles
 * Example:
 * - user A (in tenant X) → Role: Finance Manager
 * - user A (in tenant X) → Role: Budget Owner
 * - user B (in tenant X) → Role: Sales Specialist
 *
 * All is tenant-specific.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'user_roles' })
@Index('idx_user_roles_user', ['user_tenant_id'])
@Index('idx_user_roles_role', ['role_id'])
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Reference to user_tenants.id */
  @Column({ type: 'uuid', nullable: false })
  user_tenant_id!: string;

  /** Role ID */
  @Column({ type: 'uuid', nullable: false })
  role_id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
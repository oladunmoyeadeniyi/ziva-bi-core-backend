/**
 * role-permissions.entity.ts
 *
 * Ziva BI — Junction table mapping roles ↔ permissions.
 *
 * Each tenant assigns permissions to roles:
 * - Role: Finance Manager
 *   Permissions:
 *     - approve_payment_request
 *     - view_vendor
 *     - post_journal
 *
 * This structure supports many-to-many relationships.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'role_permissions' })
@Index('idx_role_perm_role', ['role_id'])
@Index('idx_role_perm_permission', ['permission_id'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Role ID */
  @Column({ type: 'uuid', nullable: false })
  role_id!: string;

  /** Permission ID */
  @Column({ type: 'uuid', nullable: false })
  permission_id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
/**
 * permissions.entity.ts
 *
 * Ziva BI — Permission entity for fine-grained access control.
 *
 * Examples of permissions:
 * - can_view_vendor
 * - can_edit_vendor
 * - can_approve_payment_request_level1
 * - can_approve_payment_request_level2
 * - can_post_journal
 * - can_upload_budget
 * - can_view_inventory
 * - can_manage_employee
 *
 * These are globally defined by Super Admin.
 * Tenants receive a copy they can enable/disable for roles.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'permissions' })
export class Permission {
  /** UUID primary key */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Unique permission key, e.g., "view_vendor", "approve_payment_lvl2" */
  @Column({ type: 'text', nullable: false, unique: true })
  @Index()
  key!: string;

  /** Human-readable label */
  @Column({ type: 'text', nullable: false })
  label!: string;

  /** Description for admins */
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
/**
 * roles.entity.ts
 *
 * Ziva BI — Role entity for RBAC (Role-Based Access Control)
 *
 * Each tenant defines its own roles.
 * Examples:
 * - Admin
 * - Finance Manager
 * - Accountant
 * - Approver Level 1
 * - Approver Level 2
 * - Budget Owner
 * - Warehouse Manager
 * - Sales Specialist
 *
 * Roles support:
 * - Custom naming
 * - Custom description
 * - Soft delete (is_active = false)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'roles' })
export class Role {
  /** UUID primary key */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Tenant to which this role belongs */
  @Column({ type: 'uuid', nullable: false })
  @Index()
  tenant_id!: string;

  /** Role name (must be unique per tenant) */
  @Column({ type: 'text', nullable: false })
  @Index()
  name!: string;

  /** Optional description of the role */
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** Soft delete flag */
  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
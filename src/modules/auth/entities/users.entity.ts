/**
 * users.entity.ts
 *
 * Ziva BI — Global User identity (TypeORM entity)
 *
 * This entity represents a human identity in the platform.
 * A single person may belong to multiple tenants (user_tenants).
 *
 * Notes:
 * - This table intentionally separates "identity" from "tenant membership"
 *   so one person (email) can be associated with multiple tenants with
 *   different login credentials and roles per tenant.
 * - Avoid placing auth credentials here; credentials live in user_tenants.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  /** Primary key: UUID */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Primary/global email for the user (optional).
   * This is NOT the tenant-scoped login email (that's in user_tenants).
   * We index it for quick lookup when searching users globally.
   */
  @Column({ type: 'text', nullable: true })
  @Index()
  primary_email?: string | null;

  /**
   * Primary/global phone for the user (optional).
   * Not the tenant-scoped login phone (that's in user_tenants).
   */
  @Column({ type: 'text', nullable: true })
  @Index()
  primary_phone?: string | null;

  /** Friendly display name (Full name) */
  @Column({ type: 'text', nullable: true })
  display_name?: string | null;

  /**
   * Indicates if the user is disabled globally.
   * Tenant-level disable is on user_tenants.is_active.
   */
  @Column({ type: 'boolean', default: false })
  disabled!: boolean;

  /** When the user record was created */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  /** When the user record was last updated */
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
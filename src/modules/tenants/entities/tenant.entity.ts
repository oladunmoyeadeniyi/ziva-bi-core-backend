/************************************************************************************************
 * TENANT ENTITY
 *
 * Represents a single organization/company inside Ziva BI.
 *
 * Notes:
 * - Multi-tenant architecture relies on strict tenant ID isolation.
 * - Every business object (Users, Vendors, Expenses, AR, AP, Assets, Payroll, etc.)
 *   must store a tenant_id to enforce data separation.
 * - Controlled by Super Admin, and partially by Tenant Admin.
 ************************************************************************************************/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Company legal name */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** Unique company code (short), used internally */
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  /** Email for general notifications */
  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string;

  /** Phone number */
  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_phone: string;

  /** Whether this tenant is active or suspended */
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  /** Optional: industry classification for AI model tuning */
  @Column({ type: 'varchar', length: 100, nullable: true })
  industry?: string;

  /** Optional: country this tenant operates in — affects tax rules */
  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  /** Optional: timezone for timestamp alignment */
  @Column({ type: 'varchar', length: 100, default: 'UTC' })
  timezone: string;

  /** Deletion flag (soft delete reserved for future use) */
  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
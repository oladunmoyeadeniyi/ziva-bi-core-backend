/************************************************************************************************
 * TENANT MODULE ENTITY
 *
 * Keeps track of which modules are activated for a tenant.
 * Examples:
 *   - EXPENSE_MANAGEMENT
 *   - ACCOUNTS_PAYABLE
 *   - ACCOUNTS_RECEIVABLE
 *   - PAYROLL
 *   - BANK_RECONCILIATION
 *   - VENDOR_PORTAL
 *   - CUSTOMER_PORTAL
 *   - TAX_ENGINE
 *   - FIXED_ASSETS
 *   - INVENTORY
 *   - 3PL / WAREHOUSE
 *
 * This allows:
 * - Role-based exposure of modules
 * - Super Admin ability to activate/deactivate per tenant
 * - Billing alignment
 ************************************************************************************************/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenant_modules')
export class TenantModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tenant owning this module */
  @Column({ type: 'uuid' })
  tenant_id: string;

  /** Name/Code of module internally */
  @Column({ type: 'varchar', length: 150 })
  module_key: string;

  /** Display name for Tenant Admin UI */
  @Column({ type: 'varchar', length: 255 })
  module_name: string;

  /** Whether enabled for this tenant */
  @Column({ type: 'boolean', default: true })
  is_enabled: boolean;

  /** Optional: when the module subscription expires */
  @Column({ type: 'timestamp', nullable: true })
  expiry_at?: Date;

  /** For audit purposes */
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
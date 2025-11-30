/************************************************************************************************
 * TENANT SETTINGS ENTITY
 *
 * Stores all configuration specific to a tenant:
 *
 * Examples:
 *  - Chart of Accounts (COA) JSON
 *  - Dimension architecture (Real IO, CC IO, Material IO, Location, Custom Dimensions)
 *  - Tax rules & jurisdiction rules (VAT/WHT/Reverse VAT/etc)
 *  - Workflow configuration (# of approvers, roles, dynamic approval)
 *  - Currency & FX conversion rules
 *  - Document numbering format
 *  - Thresholds, caps, limitations (per-diem, travel advance caps, etc)
 *  - Vendor onboarding extra fields
 *  - OCR/AI configuration
 *
 * NOTE:
 *   These settings are JSON to allow EXTREME flexibility.
 *   Future upgrades will not break old tenants.
 ************************************************************************************************/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('tenant_settings')
export class TenantSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  /** Chart of Accounts (fully configurable per tenant) */
  @Column({ type: 'jsonb', nullable: true })
  chart_of_accounts?: any;

  /** Dimensions: IOs, Cost Centers, Material IOs, Locations, Custom Dims */
  @Column({ type: 'jsonb', nullable: true })
  dimensions?: any;

  /** Tax configuration (VAT, WHT, Reverse VAT, jurisdiction rules, rates) */
  @Column({ type: 'jsonb', nullable: true })
  tax_rules?: any;

  /** Workflow setup (approval paths, line manager depth, GM layer, Finance layer, etc.) */
  @Column({ type: 'jsonb', nullable: true })
  workflows?: any;

  /** Expense rules — caps, categories, allowed GLs, OCR rules */
  @Column({ type: 'jsonb', nullable: true })
  expense_rules?: any;

  /** AR/AP rules (credit terms, tolerances, matching rules) */
  @Column({ type: 'jsonb', nullable: true })
  ar_ap_rules?: any;

  /** Inventory & cost valuation rules */
  @Column({ type: 'jsonb', nullable: true })
  inventory_rules?: any;

  /** Document prefix settings (e.g. EXP-2025-001) */
  @Column({ type: 'jsonb', nullable: true })
  document_numbering?: any;

  /** Default currency / FX modes */
  @Column({ type: 'jsonb', nullable: true })
  currency_settings?: any;

  /** OCR/AI settings */
  @Column({ type: 'jsonb', nullable: true })
  ai_settings?: any;

  /** Anything future without breaking tenants */
  @Column({ type: 'jsonb', nullable: true })
  additional_settings?: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
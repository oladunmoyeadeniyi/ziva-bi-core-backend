/**
 * tenant.entity.ts
 *
 * Ziva BI — Tenant entity (TypeORM)
 *
 * This entity represents a company/tenant on the Ziva BI platform.
 * - Uses UUID primary key (Postgres gen_random_uuid recommended)
 * - Keeps lightweight fields: name, domain, timezone, currency
 * - createdAt/updatedAt for auditing & ordering
 *
 * How to use:
 * - Import into your Auth module or a shared Entities module and add to TypeORM
 * - This matches the SQL DDL in the PRD (Section 7)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'tenants' })
export class Tenant {
  /** Primary key (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Human-friendly tenant/company name */
  @Column({ type: 'text', nullable: false })
  @Index()
  name!: string;

  /**
   * Optional custom domain for tenant portal (e.g., app.acme.com)
   * Used for branding/whitelabeling and routing.
   */
  @Column({ type: 'text', nullable: true })
  domain?: string | null;

  /**
   * Tenant timezone (IANA string). Defaults to UTC if omitted.
   * Used by UI to render local times for that tenant.
   */
  @Column({ type: 'text', nullable: false, default: 'UTC' })
  timezone!: string;

  /**
   * Default currency code for tenant (ISO 4217)
   * Used by UI defaults and currency conversion fallbacks.
   */
  @Column({ type: 'char', length: 3, nullable: false, default: 'USD' })
  currency_code!: string;

  /** Created timestamp (Postgres timestamptz) */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  /** Updated timestamp (Postgres timestamptz) */
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
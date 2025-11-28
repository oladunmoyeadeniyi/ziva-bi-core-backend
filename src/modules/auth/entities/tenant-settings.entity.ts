/**
 * tenant-settings.entity.ts
 *
 * Ziva BI — Tenant Settings entity (TypeORM)
 *
 * This entity stores tenant-specific configuration as JSONB so the platform stays flexible:
 * Example keys:
 * - password_policy: { minLength: 8, requireNumbers: true, ... }
 * - otp_ttl_seconds: 300
 * - mfa_level: 2
 * - session_timeout_minutes: 60
 *
 * Notes:
 * - Use JSONB to allow future settings without DB migration.
 * - Add a small API to allow Tenant Admin to edit these safely (we'll implement that in a later step).
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity({ name: 'tenant_settings' })
export class TenantSettings {
  /**
   * Primary key is the tenant_id (same UUID as tenants.id).
   * We use PrimaryColumn (not generated) because this row is tied 1:1 with Tenant.
   */
  @PrimaryColumn('uuid')
  tenant_id!: string;

  /**
   * JSONB column containing tenant settings. Keep default as empty object.
   * Example structure (suggested):
   * {
   *   "password_policy": { "minLength": 8, "requireUpper": true, "expiryDays": 180 },
   *   "mfa_level": 1,
   *   "otp_ttl_seconds": 300,
   *   "session_timeout_minutes": 60,
   *   "allow_phone_otp": true
   * }
   */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  settings!: Record<string, any>;

  /** Audit timestamps */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  /**
   * Optional relation helper so you can do settings.tenant in TypeORM if needed.
   * This is convenience — not required for DB integrity (Tenant+TenantSettings tied by primary key)
   */
  @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;
}
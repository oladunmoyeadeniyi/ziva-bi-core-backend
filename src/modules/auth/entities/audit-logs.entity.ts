/**
 * audit-logs.entity.ts
 *
 * Ziva BI — Security / System Audit Logs
 *
 * Purpose:
 * - Immutable record of security-relevant events: logins, failed auth, permission changes,
 *   role assignments, data exports, vendor onboarding approvals, system config changes, etc.
 *
 * Requirements:
 * - Append-only: avoid updates to core fields; updates should write another audit row.
 * - Make searchable by tenant, user, event_type, and time range.
 * - Keep large `meta` JSON for detailed context (but guard against leaking secrets).
 *
 * Note: For very large tenants, consider moving older audit rows to a cold store (S3/BigQuery).
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
@Index('idx_audit_tenant_time', ['tenant_id', 'created_at'])
@Index('idx_audit_user', ['user_tenant_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Tenant scope (useful for multi-tenant query isolation) */
  @Column({ type: 'uuid', nullable: false })
  tenant_id!: string;

  /** Tenant-scoped user (if applicable) */
  @Column({ type: 'uuid', nullable: true })
  user_tenant_id?: string | null;

  /** Event type (login_success, login_failed, permission_granted, vendor_approved, etc.) */
  @Column({ type: 'text', nullable: false })
  event_type!: string;

  /** Short human-friendly summary */
  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  /**
   * JSON metadata for the event: request body, IP, userAgent, delta of change, previous value, etc.
   * Must avoid storing secrets or raw tokens.
   */
  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  meta!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
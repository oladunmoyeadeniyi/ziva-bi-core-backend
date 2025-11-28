/**
 * sessions.entity.ts
 *
 * Ziva BI — Session entity
 *
 * Purpose:
 * - Tracks each authenticated session (device + browser + login instance).
 * - Binds refresh tokens to a session for safe rotation and revocation.
 * - Allows tenant admins / users to list and revoke active sessions.
 *
 * Security notes:
 * - Do NOT store secret tokens here (refresh tokens are stored hashed in refresh_tokens).
 * - Keep device_fingerprint non-identifying (hash, not raw PII).
 * - Expire sessions after tenant-configurable idle/absolute time.
 *
 * Scaling notes:
 * - This table can grow large; plan for partitioning by created_at for large installations.
 * - Indexes on user_tenant_id and is_revoked for fast revocation queries.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'sessions' })
@Index('idx_sessions_user_tenant', ['user_tenant_id'])
export class Session {
  /** Unique session id (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** FK -> user_tenants.id (tenant-scoped user membership) */
  @Column({ type: 'uuid', nullable: false })
  user_tenant_id!: string;

  /**
   * Optional device fingerprint (hashed) used to identify trusted devices.
   * Should be generated client-side and sent during login (e.g., hash of userAgent + deviceId).
   * Keep it privacy-preserving — do not store raw MAC or unique device identifiers.
   */
  @Column({ type: 'text', nullable: true })
  device_fingerprint?: string | null;

  /** IP address (nullable) */
  @Column({ type: 'inet', nullable: true })
  ip_address?: string | null;

  /** User agent string (nullable) */
  @Column({ type: 'text', nullable: true })
  user_agent?: string | null;

  /** When session was created */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  /** When session was last accessed (update on token usage) */
  @Column({ type: 'timestamptz', nullable: false, default: () => 'now()' })
  last_accessed!: Date;

  /** Absolute expiry datetime (optional, set by tenant policy) */
  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null;

  /** Soft-revoked flag (true => session is disabled) */
  @Column({ type: 'boolean', default: false })
  is_revoked!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
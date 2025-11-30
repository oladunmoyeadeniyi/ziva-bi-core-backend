import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Session entity
 *
 * Purpose:
 * - Track an authenticated session (ties to a refresh token optionally)
 * - Useful for session listing, revocation, device tracking, security logs
 *
 * Fields:
 * - user_tenant_id: the user-in-tenant identifier (nullable to be resilient)
 * - refresh_token_id: optional FK linking to refresh_tokens.id
 * - ip, user_agent: device context for session
 * - active: flag to quickly mark session as revoked
 * - last_accessed_at: helpful for TTL / session expiry insights
 *
 * Indexes:
 * - user_tenant_id for fast listing of sessions per user
 * - refresh_token_id for token -> session lookup
 */

@Entity({ name: 'sessions' })
@Index(['user_tenant_id'])
@Index(['refresh_token_id'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * user_tenant_id links user to tenant context. Keep nullable to avoid FK constraints
   * where user_tenants table migrations may not yet be applied during deploy order.
   */
  @Column({ name: 'user_tenant_id', type: 'uuid', nullable: true })
  user_tenant_id?: string | null;

  /** Optional link to the refresh token row (if used) */
  @Column({ name: 'refresh_token_id', type: 'uuid', nullable: true })
  refresh_token_id?: string | null;

  /** IP address that created the session */
  @Column({ type: 'varchar', length: 100, nullable: true })
  ip?: string | null;

  /** Browser / device user agent */
  @Column({ name: 'user_agent', type: 'varchar', length: 1024, nullable: true })
  user_agent?: string | null;

  /** Active indicates if session is still valid (not revoked) */
  @Column({ type: 'boolean', default: true })
  active: boolean;

  /** When session was created */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  /** When session was last used (e.g. upon token refresh) */
  @Column({ name: 'last_accessed_at', type: 'timestamptz', nullable: true })
  last_accessed_at?: Date | null;

  /** Optional update timestamp */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updated_at?: Date;
}
/**
 * refresh-tokens.entity.ts
 *
 * Ziva BI — Refresh token storage (hashed)
 *
 * Purpose:
 * - Store hashed refresh tokens and metadata for rotation and revocation.
 * - Link to a session (so when a session is revoked, linked tokens are revoked).
 *
 * Security requirements:
 * - Never store raw refresh token. Hash using HMAC-SHA256 with a server-side secret or use bcrypt.
 * - On incoming token, hash the incoming value the same way and compare.
 * - Implement refresh-token rotation: when a refresh token is used, issue a new one and mark the old as replaced_at / revoked_at.
 *
 * Fields explained:
 * - token_hash: hash of the refresh token (one-way).
 * - issued_at / expires_at: lifecycle.
 * - revoked_at: timestamp when it was explicitly revoked.
 * - replaced_by: pointer to the new token id (rotation chain).
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'refresh_tokens' })
@Index('idx_refresh_session', ['session_id'])
@Index('idx_refresh_token_hash', ['token_hash'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** FK -> sessions.id (session binding) */
  @Column({ type: 'uuid', nullable: true })
  session_id?: string | null;

  /**
   * Hash of the refresh token (HMAC-SHA256 or bcrypt).
   * We use a long text field to support different hash algorithms.
   */
  @Column({ type: 'text', nullable: false })
  token_hash!: string;

  /** When token was issued */
  @CreateDateColumn({ type: 'timestamptz' })
  issued_at!: Date;

  /** When token expires (tenant-configurable) */
  @Column({ type: 'timestamptz', nullable: false })
  expires_at!: Date;

  /** When token was revoked (if any) */
  @Column({ type: 'timestamptz', nullable: true })
  revoked_at?: Date | null;

  /** Points to the id of the token that replaced this one during rotation */
  @Column({ type: 'uuid', nullable: true })
  replaced_by?: string | null;
}
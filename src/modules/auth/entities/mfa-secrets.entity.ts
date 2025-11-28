/**
 * mfa-secrets.entity.ts
 *
 * Ziva BI — MFA secrets and trusted-device flags.
 *
 * Purpose:
 * - Store per user_tenant MFA configuration:
 *    - TOTP secret (encrypted)
 *    - Backup codes (hashed)
 *    - Whether MFA is enforced for the tenant/user
 *    - Trusted device records may be saved here or in sessions
 *
 * Security:
 * - **Encrypt** TOTP secrets at rest (application-level encryption using a KMS or server secret).
 * - Backup codes should be stored hashed (one-way).
 * - Access to this table must be tightly restricted and audited.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'mfa_secrets' })
@Index('idx_mfa_user', ['user_tenant_id'])
export class MfaSecret {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Tenant-scoped user membership (user_tenants.id) */
  @Column({ type: 'uuid', nullable: false })
  user_tenant_id!: string;

  /**
   * Encrypted TOTP secret.
   * - Application must encrypt/decrypt using KMS or strong symmetric key.
   * - Format: base64(encrypt(raw_secret))
   */
  @Column({ type: 'text', nullable: true })
  encrypted_totp_secret?: string | null;

  /**
   * Hashed backup codes (multiple codes concatenated or stored separately in an audit table).
   * - Hash using HMAC-SHA256 or bcrypt.
   */
  @Column({ type: 'text', nullable: true })
  backup_codes_hash?: string | null;

  /** Is MFA enabled for this user? */
  @Column({ type: 'boolean', default: false })
  is_enabled!: boolean;

  /** Is MFA enforced (tenant policy may enforce for all users) */
  @Column({ type: 'boolean', default: false })
  is_enforced!: boolean;

  /** When this row was created */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  /** When it was last updated */
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
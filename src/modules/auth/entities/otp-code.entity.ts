import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * OTP Code entity
 *
 * Purpose:
 * - Store one-time codes issued for verification flows (login, password reset, 2FA, vendor verification, etc.)
 * - Minimal, audit-friendly footprint: created_at, expires_at, consumed_at
 *
 * Notes:
 * - subject: email or phone number or any unique subject (lowercased normalized)
 * - purpose: business purpose e.g. 'login', 'reset-password', 'vendor-onboard'
 * - code: can be plaintext here (short-lived) OR hashed if extreme security is required.
 *   We keep the code plaintext to enable support for stateless verification in tests and email delivery,
 *   but you can easily switch to storing hash by using auth.helper.hashToken(code) before save.
 *
 * Indexes:
 * - subject + purpose lookup (common)
 * - expires_at to purge old rows
 */

@Entity({ name: 'otp_codes' })
@Index(['subject', 'purpose'])
export class OtpCode {
  /** Primary UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Optional tenant id — useful in multi-tenant environment to scope OTPs.
   * Example: when tenant-specific verification is needed.
   */
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenant_id?: string | null;

  /**
   * The subject of the OTP - typically email or phone number.
   * We recommend normalized (lowercased) strings on insert.
   */
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  /** The actual OTP value (e.g. 6-digit code). */
  @Column({ type: 'varchar', length: 64 })
  code: string;

  /**
   * Purpose of the OTP - short namespace string.
   * Examples: 'login', 'reset-password', 'two-factor', 'vendor-onboard'
   */
  @Column({ type: 'varchar', length: 64 })
  purpose: string;

  /** When this OTP will expire and should no longer be accepted. */
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expires_at: Date;

  /**
   * When the code was consumed (if consumed). Null if not yet consumed.
   * We write consumed_at when code is used successfully.
   */
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumed_at?: Date | null;

  /** Audit column */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
/**
 * otp-codes.entity.ts
 *
 * Ziva BI — One-Time Passcodes (OTP) storage
 *
 * Purpose:
 * - Short-lived numeric or alpha-numeric codes used for login/verification.
 * - Can be used for email OTP, SMS OTP, or app-based one-time codes.
 *
 * Security:
 * - Store codes hashed (HMAC-SHA256) to avoid storing raw OTPs in DB.
 * - Keep TTL short (e.g., 300s default); tenant-configurable in tenant_settings.
 * - Track attempts and lock after configurable failed attempts to prevent brute force.
 *
 * Usage pattern:
 * - On request: generate code, store hash in DB with expires_at, send raw code to user.
 * - On verification: hash presented code and search non-expired record by subject + purpose.
 * - Mark as used (consumed_at) after successful verification.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'otp_codes' })
@Index('idx_otp_subject', ['tenant_id', 'subject', 'purpose'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Tenant scope */
  @Column({ type: 'uuid', nullable: false })
  tenant_id!: string;

  /**
   * Subject - identify who this OTP is for
   * - Could be user_tenants.id, an email, or phone number depending on flow
   */
  @Column({ type: 'text', nullable: false })
  subject!: string;

  /**
   * Purpose - e.g., 'login', 'password_reset', 'vendor_verification'
   * Keeps OTP usage auditable and separated.
   */
  @Column({ type: 'text', nullable: false })
  purpose!: string;

  /**
   * Hashed OTP value (HMAC or bcrypt). Never store the raw code.
   * Use same algorithm & secret at verification time.
   */
  @Column({ type: 'text', nullable: false })
  code_hash!: string;

  /** When OTP expires */
  @Column({ type: 'timestamptz', nullable: false })
  expires_at!: Date;

  /** When consumed (used) — null if unused */
  @Column({ type: 'timestamptz', nullable: true })
  consumed_at?: Date | null;

  /** Number of failed verification attempts */
  @Column({ type: 'int', default: 0 })
  attempts!: number;

  /** Max attempts allowed before lockout (tenant policy may override) */
  @Column({ type: 'int', default: 5 })
  max_attempts!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
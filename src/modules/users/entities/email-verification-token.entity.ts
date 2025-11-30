/*********************************************************************************************
 * EMAIL VERIFICATION TOKEN ENTITY
 *
 * Sends verification link after user registers.
 * Tokens expire in 24 hours.
 *********************************************************************************************/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  user_id: string;

  /** Secure hash of the verification token */
  @Column()
  token_hash: string;

  /** Expiry (default 24 hours) */
  @Column({ type: 'timestamp' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  used: boolean;
}
/*********************************************************************************************
 * PASSWORD RESET TOKEN ENTITY
 *
 * Handles the "Forgot Password" cycle securely.
 * Tokens expire in 15 minutes by default.
 *********************************************************************************************/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** FK → user */
  @Index()
  @Column()
  user_id: string;

  /** Token hash (we never store raw token) */
  @Column()
  token_hash: string;

  /** Expiry datetime */
  @Column({ type: 'timestamp' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  used: boolean;
}
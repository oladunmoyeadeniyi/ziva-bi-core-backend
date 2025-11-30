/*********************************************************************************************
 * USER SECURITY LOG ENTITY
 *
 * Tracks:
 * - Login attempts
 * - Password changes
 * - Suspicious activity
 * - Session invalidations
 *
 * This enables high-grade security auditing.
 *********************************************************************************************/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_security_logs')
export class UserSecurityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  /** What happened? ("login_success", "login_failed", "password_changed", etc.) */
  @Column({ type: 'varchar', length: 60 })
  event_type: string;

  /** Optional extra details (IP address, device info, etc.) */
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;
}
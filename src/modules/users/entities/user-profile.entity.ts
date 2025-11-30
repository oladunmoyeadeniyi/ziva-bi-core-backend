/*********************************************************************************************
 * USER PROFILE ENTITY
 *
 * Stores additional information about the person:
 * - Phone number
 * - Job title (e.g., Accountant, GM, CFO)
 * - Avatar image URL
 * - Department
 * - Optional HR employee ID
 *
 * This is intentionally kept separate from core identity.
 *********************************************************************************************/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** FK → users.id */
  @Column()
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  job_title: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  avatar_url: string;

  /** Optional employee ID (useful for payroll & HR integration) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  employee_code: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
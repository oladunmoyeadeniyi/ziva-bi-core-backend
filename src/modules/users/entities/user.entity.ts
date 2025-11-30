/**
 * User entity
 *
 * Minimal, production-oriented user table.
 * - Password should be stored hashed (UsersService uses argon2)
 * - Email is unique
 * - Core user profile fields are present
 * - is_active flag allows soft disable
 *
 * NOTE: Authentication uses separate modules/guards. This entity is the source of truth for users.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  // Stored hashed password. Never return to clients.
  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  // Global active flag for the user (not tenant-specific)
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // Soft-delete indicator
  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  // Optional metadata (json) for future fields (e.g. ldap id, external id)
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
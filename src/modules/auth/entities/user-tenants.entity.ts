/**
 * user-tenants.entity.ts
 *
 * Ziva BI — Tenant membership entity (TypeORM)
 *
 * This entity ties the global user identity to a specific tenant (company).
 * It stores the tenant-scoped login identifiers (email, phone), password hash,
 * verification flags, and activation status.
 *
 * Important:
 * - Password & verification info is per-tenant (user may have different credentials on different tenants).
 * - When authenticating, we will lookup the record by tenant_id + login_email OR tenant_id + login_phone.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './users.entity';

@Entity({ name: 'user_tenants' })
@Index('idx_user_tenants_tenant_user', ['tenant_id', 'user_id'])
@Index('idx_user_tenants_email', ['tenant_id', 'login_email'])
@Index('idx_user_tenants_phone', ['tenant_id', 'login_phone'])
export class UserTenant {
  /** PK UUID */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Tenant reference (UUID) */
  @Column({ type: 'uuid' })
  tenant_id!: string;

  /** FK to global users table */
  @Column({ type: 'uuid' })
  user_id!: string;

  /**
   * Tenant-scoped login email.
   * Nullable to support phone-only accounts or passwordless flows.
   * We store lowercase in the application before persist to make lookups case-insensitive.
   */
  @Column({ type: 'text', nullable: true })
  login_email?: string | null;

  /**
   * Tenant-scoped login phone.
   * Nullable to support email-first accounts.
   */
  @Column({ type: 'text', nullable: true })
  login_phone?: string | null;

  /**
   * Password hash (argon2/bcrypt). Nullable for passwordless or OTP-only accounts.
   * Store only the hash here; never store raw passwords.
   */
  @Column({ type: 'text', nullable: true })
  password_hash?: string | null;

  /** Flags and status */
  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_email_verified!: boolean;

  @Column({ type: 'boolean', default: false })
  is_phone_verified!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  /**
   * Relations (optional helpers)
   * We declare ManyToOne relations to allow TypeORM to JOIN conveniently.
   * These are convenience references — ensure the relation names match your import paths.
   */
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
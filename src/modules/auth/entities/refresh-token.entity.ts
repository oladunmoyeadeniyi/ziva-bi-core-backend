/**
 * RefreshToken entity
 *
 * Stores refresh tokens issued to a userTenant (tenant-scoped)
 * - tokenHash: hashed refresh token (so token string is not stored raw)
 * - user_tenant_id: the tenant-scoped identity
 * - revoked: for revocation / logout
 * - expires_at: expiry date (used for cleanup)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  user_tenant_id: string;

  // store hashed refresh token (argon2)
  @Column({ type: 'varchar', length: 512 })
  token_hash: string;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date;

  @CreateDateColumn()
  created_at: Date;
}
/**
 * UserTenant entity
 *
 * Connects a User to a Tenant with tenant-scoped identity.
 * - A user may have multiple user_tenant rows (employee in multiple companies)
 * - This is the ID you will pass to RBAC.assignRoleToUser (userTenantId)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_tenants')
export class UserTenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenant_id: string;

  // username or login alias within tenant (optional)
  @Column({ type: 'varchar', length: 150, nullable: true })
  alias?: string;

  // tenant specific role or job title (optional)
  @Column({ type: 'varchar', length: 150, nullable: true })
  job_title?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
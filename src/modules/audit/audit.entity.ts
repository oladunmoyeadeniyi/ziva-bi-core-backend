import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * AuditEntity
 *
 * Tracks audit events across the platform (RBAC, Auth, AP, AR, Payroll, Inventory, etc).
 * Designed to be tenant-aware (tenant_id optional for system-level events).
 *
 * Key fields:
 *  - id: uuid
 *  - tenant_id: tenant/organization identifier (nullable for system-level events)
 *  - actor_id: user who triggered the action (nullable for system or automated tasks)
 *  - action: short action key (rbac.role.create, auth.login.success, ap.payment.approve, ...)
 *  - resource_type: which resource was affected (Role, Permission, PaymentRequest, Invoice, ...)
 *  - resource_id: identifier of the resource (optional)
 *  - details: JSON payload with contextual information (old/new values, diff, ip, user-agent)
 *  - created_at: timestamp
 */
@Entity({ name: 'audit_logs' })
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'varchar', length: 128, nullable: true })
  tenant_id?: string | null;

  @Index()
  @Column({ name: 'actor_id', type: 'varchar', length: 128, nullable: true })
  actor_id?: string | null;

  @Index()
  @Column({ name: 'action', type: 'varchar', length: 200 })
  action: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 100, nullable: true })
  resource_type?: string | null;

  @Column({ name: 'resource_id', type: 'varchar', length: 128, nullable: true })
  resource_id?: string | null;

  // JSONB if using Postgres — TypeORM will map JS object to JSONB
  @Column({ name: 'details', type: 'jsonb', nullable: true })
  details?: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
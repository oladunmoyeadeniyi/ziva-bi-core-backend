import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from './audit.entity';

/**
 * AuditService
 *
 * Responsibilities:
 *  - Log events (write-only interface for most code paths)
 *  - Query logs for tenant admins / super-admins
 *  - Basic filters (tenant, actor, action, resource_type, date range)
 *
 * Note: In production, consider:
 *  - Write-through to a centralized log (e.g., Cloud Logging, ELK, Datadog)
 *  - Archival strategy (old events moved to cold storage)
 *  - Rate limiting on query endpoints
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Audit)
    private readonly repo: Repository<Audit>,
  ) {}

  /**
   * Log an audit event.
   *
   * @param action short key (rbac.role.create, auth.login.failure)
   * @param params includes tenantId, actorId, resourceType, resourceId, details
   */
  async log(
    action: string,
    params: {
      tenantId?: string | null;
      actorId?: string | null;
      resourceType?: string | null;
      resourceId?: string | null;
      details?: Record<string, any> | null;
    } = {},
  ): Promise<Audit> {
    const record = this.repo.create({
      action,
      tenant_id: params.tenantId ?? null,
      actor_id: params.actorId ?? null,
      resource_type: params.resourceType ?? null,
      resource_id: params.resourceId ?? null,
      details: params.details ?? null,
    });
    return this.repo.save(record);
  }

  /**
   * Query audit logs with basic filters.
   * Tenant admins should only be allowed to query their tenant logs.
   *
   * @param filters object with optional tenantId, actorId, action, resourceType, from, to, limit, offset
   */
  async query(filters: {
    tenantId?: string | null;
    actorId?: string | null;
    action?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    from?: Date | null;
    to?: Date | null;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Audit[]; total: number }> {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');

    if (filters.tenantId) qb.andWhere('a.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters.actorId) qb.andWhere('a.actor_id = :actorId', { actorId: filters.actorId });
    if (filters.action) qb.andWhere('a.action = :action', { action: filters.action });
    if (filters.resourceType) qb.andWhere('a.resource_type = :resourceType', { resourceType: filters.resourceType });
    if (filters.resourceId) qb.andWhere('a.resource_id = :resourceId', { resourceId: filters.resourceId });
    if (filters.from) qb.andWhere('a.created_at >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('a.created_at <= :to', { to: filters.to });

    const limit = Math.min(filters.limit ?? 50, 1000);
    const offset = filters.offset ?? 0;
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
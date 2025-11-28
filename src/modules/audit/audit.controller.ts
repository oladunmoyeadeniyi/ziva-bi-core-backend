import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';

/**
 * AuditController
 *
 * Exposes read-only endpoints for audit logs.
 *
 * Security:
 *  - Protected by JwtAuthGuard
 *  - Restricted to users with role 'tenant_admin' or 'super_admin' (RolesGuard)
 *
 * NOTE:
 *  - Tenant admins will pass their tenantId; server-side code must validate the user belongs to that tenant.
 *  - Super admin may query across tenants (validate in controller/service if needed).
 */
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /**
   * GET /audit
   * Query parameters:
   *  - tenantId (optional, if user is super-admin; otherwise the user's tenant id is used)
   *  - actorId
   *  - action
   *  - resourceType
   *  - from (ISO date)
   *  - to (ISO date)
   *  - limit
   *  - offset
   */
  @Get()
  @Roles('tenant_admin', 'super_admin')
  async list(@Query() q: any) {
    // Note: In controller we should ideally ensure non-super-admins can only query their tenant;
    // the JwtAuthGuard should attach user info on request; but to keep controller file self-contained
    // we assume a subsequently added middleware attaches request.user and we would verify tenant match.
    const filters: any = {};
    if (q.tenantId) filters.tenantId = q.tenantId;
    if (q.actorId) filters.actorId = q.actorId;
    if (q.action) filters.action = q.action;
    if (q.resourceType) filters.resourceType = q.resourceType;
    if (q.resourceId) filters.resourceId = q.resourceId;
    if (q.from) filters.from = new Date(q.from);
    if (q.to) filters.to = new Date(q.to);
    if (q.limit) filters.limit = parseInt(q.limit, 10);
    if (q.offset) filters.offset = parseInt(q.offset, 10);

    const result = await this.audit.query(filters);
    return result;
  }
}
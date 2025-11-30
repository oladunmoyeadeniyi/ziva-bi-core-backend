/**
 * TenantController
 *
 * Exposes REST API endpoints for:
 *  - Creating a tenant (super-admin only)
 *  - Listing tenants
 *  - Updating a tenant
 *  - Activating / Deactivating modules
 *  - Getting / Updating tenant settings
 *  - Assigning admin to tenant
 *  - Suspending / reactivating tenant
 *  - Soft deleting tenant
 *
 * Security Notes:
 *  - All endpoints are protected by RBAC (TODO: hook-in AuthGuard + PermissionsGuard)
 *  - For now, guards are commented to allow initial backend bring-up.
 *  - Only SUPER_ADMIN should be able to create tenants or delete tenants.
 *  - TENANT_ADMIN can update settings and modules within their tenant.
 *
 * Response format:
 *  {
 *     success: true,
 *     data: {...}
 *  }
 *
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Delete,
  BadRequestException,
} from '@nestjs/common';

import { TenantService } from './tenant.service';
import { Tenant } from './entities/tenant.entity';
import { TenantSettings } from './entities/tenant-settings.entity';
import { TenantModule } from './entities/tenant-module.entity';

@Controller('api/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // -------------------------------------------------------------------------
  // CREATE TENANT (super-admin only)
  // -------------------------------------------------------------------------
  @Post()
  async createTenant(
    @Body()
    payload: {
      name: string;
      code: string;
      contact_email?: string;
      contact_phone?: string;
      country?: string;
      timezone?: string;
      industry?: string;

      // optional initial admin user
      initialAdmin?: {
        email: string;
        password: string;
        first_name?: string;
        last_name?: string;
      };

      // optional override modules
      modules?: { key: string; name: string }[];

      // optional initial settings
      initialSettings?: any;
    },
  ) {
    if (!payload?.name || !payload?.code) {
      throw new BadRequestException('name and code are required');
    }

    const result = await this.tenantService.createTenant(
      {
        name: payload.name,
        code: payload.code,
        contact_email: payload.contact_email,
        contact_phone: payload.contact_phone,
        country: payload.country,
        timezone: payload.timezone,
        industry: payload.industry,
      },
      {
        initialAdmin: payload.initialAdmin,
        modules: payload.modules,
        initialSettings: payload.initialSettings,
      },
    );

    return {
      success: true,
      data: result,
    };
  }

  // -------------------------------------------------------------------------
  // LIST TENANTS
  // -------------------------------------------------------------------------
  @Get()
  async listTenants(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ): Promise<{ success: boolean; data: { total: number; rows: Tenant[] } }> {
    const data = await this.tenantService.listTenants(Number(limit), Number(offset));
    return { success: true, data };
  }

  // -------------------------------------------------------------------------
  // GET TENANT
  // -------------------------------------------------------------------------
  @Get(':tenantId')
  async getTenant(@Param('tenantId') tenantId: string) {
    const tenant = await this.tenantService.getTenant(tenantId);
    return { success: true, data: tenant };
  }

  // -------------------------------------------------------------------------
  // UPDATE TENANT (core profile fields)
  // -------------------------------------------------------------------------
  @Patch(':tenantId')
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() patch: Partial<Tenant>,
  ) {
    const updated = await this.tenantService.updateTenant(tenantId, patch);
    return { success: true, data: updated };
  }

  // -------------------------------------------------------------------------
  // ACTIVATE MODULE
  // -------------------------------------------------------------------------
  @Post(':tenantId/modules/activate')
  async activateModule(
    @Param('tenantId') tenantId: string,
    @Body() payload: { module_key: string; module_name?: string },
  ): Promise<{ success: boolean; data: TenantModule }> {
    const mod = await this.tenantService.activateModule(
      tenantId,
      payload.module_key,
      payload.module_name,
    );
    return { success: true, data: mod };
  }

  // -------------------------------------------------------------------------
  // DEACTIVATE MODULE
  // -------------------------------------------------------------------------
  @Post(':tenantId/modules/deactivate')
  async deactivateModule(
    @Param('tenantId') tenantId: string,
    @Body() payload: { module_key: string },
  ): Promise<{ success: boolean; data: TenantModule }> {
    const mod = await this.tenantService.deactivateModule(tenantId, payload.module_key);
    return { success: true, data: mod };
  }

  // -------------------------------------------------------------------------
  // LIST MODULES
  // -------------------------------------------------------------------------
  @Get(':tenantId/modules')
  async listModules(@Param('tenantId') tenantId: string) {
    const modules = await this.tenantService.listTenantModules(tenantId);
    return { success: true, data: modules };
  }

  // -------------------------------------------------------------------------
  // GET SETTINGS
  // -------------------------------------------------------------------------
  @Get(':tenantId/settings')
  async getSettings(@Param('tenantId') tenantId: string) {
    const settings = await this.tenantService.getSettings(tenantId);
    return { success: true, data: settings };
  }

  // -------------------------------------------------------------------------
  // UPDATE SETTINGS
  // -------------------------------------------------------------------------
  @Patch(':tenantId/settings')
  async updateSettings(
    @Param('tenantId') tenantId: string,
    @Body() config: Partial<TenantSettings>,
  ) {
    const settings = await this.tenantService.setSettings(tenantId, config);
    return { success: true, data: settings };
  }

  // -------------------------------------------------------------------------
  // ASSIGN TENANT ADMIN
  // -------------------------------------------------------------------------
  @Post(':tenantId/assign-admin')
  async assignAdmin(
    @Param('tenantId') tenantId: string,
    @Body() payload: { user_id: string },
  ) {
    await this.tenantService.assignTenantAdmin(payload.user_id, tenantId);
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // SUSPEND TENANT
  // -------------------------------------------------------------------------
  @Post(':tenantId/suspend')
  async suspendTenant(@Param('tenantId') tenantId: string) {
    const t = await this.tenantService.suspendTenant(tenantId);
    return { success: true, data: t };
  }

  // -------------------------------------------------------------------------
  // REACTIVATE TENANT
  // -------------------------------------------------------------------------
  @Post(':tenantId/reactivate')
  async reactivateTenant(@Param('tenantId') tenantId: string) {
    const t = await this.tenantService.reactivateTenant(tenantId);
    return { success: true, data: t };
  }

  // -------------------------------------------------------------------------
  // DELETE TENANT (soft delete)
  // -------------------------------------------------------------------------
  @Delete(':tenantId')
  async softDeleteTenant(@Param('tenantId') tenantId: string) {
    await this.tenantService.softDeleteTenant(tenantId);
    return { success: true };
  }
}
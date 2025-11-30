/**
 * TenantService
 *
 * Responsibilities:
 *  - Create and manage Tenant records
 *  - Manage TenantModule activation/deactivation
 *  - Manage TenantSettings (COA, dimensions, workflows, tax rules, etc)
 *  - Assign an initial Tenant Admin (optional) via UsersService
 *  - Provide helpers for tenant validation and default seeding
 *
 * Notes:
 *  - This service is tenant-aware but does NOT enforce RBAC itself. RBAC checks should be
 *    performed in controllers or guards before calling these methods.
 *  - Transactions are used where multiple DB changes must be atomic (tenant + modules + settings + initial user).
 *
 * Usage:
 *  const tenant = await tenantService.createTenant({ name, code, contact_email, initialAdmin: {email, password, firstName...} })
 */

import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Tenant } from './entities/tenant.entity';
import { TenantModule } from './entities/tenant-module.entity';
import { TenantSettings } from './entities/tenant-settings.entity';

import { UsersService } from '../users/users.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  // Default module set available on tenant creation (can be changed)
  private DEFAULT_MODULES = [
    { key: 'EXPENSE_MANAGEMENT', name: 'Expense Management' },
    { key: 'VENDOR_PORTAL', name: 'Vendor Portal' },
    { key: 'ACCOUNTS_PAYABLE', name: 'Accounts Payable' },
    // Add others as you roll them out
  ];

  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantModule) private readonly tenantModuleRepo: Repository<TenantModule>,
    @InjectRepository(TenantSettings) private readonly tenantSettingsRepo: Repository<TenantSettings>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
  ) {}

  // ---------------------------
  // Helper: validate unique code
  // ---------------------------
  private async ensureUniqueCode(code: string) {
    const exists = await this.tenantRepo.findOne({ where: { code } });
    if (exists) throw new BadRequestException('Tenant code already exists');
  }

  // ---------------------------
  // Create Tenant (atomic)
  // ---------------------------
  /**
   * createTenant
   * @param payload: minimal tenant detail { name, code, contact_email, country, timezone, industry }
   * @param options.initialAdmin optional: { email, password, first_name, last_name } - create user and assign Tenant Admin role
   *
   * Returns: created tenant (sanitized) and optionally created admin user.
   */
  async createTenant(
    payload: {
      name: string;
      code: string;
      contact_email?: string;
      contact_phone?: string;
      country?: string;
      timezone?: string;
      industry?: string;
    },
    options?: {
      initialAdmin?: { email: string; password: string; first_name?: string; last_name?: string };
      modules?: { key: string; name: string }[]; // override default modules
      initialSettings?: any; // seed tenant settings
    },
  ): Promise<{ tenant: Tenant; adminUser?: any }> {
    if (!payload || !payload.name || !payload.code) {
      throw new BadRequestException('Tenant name and code are required');
    }

    await this.ensureUniqueCode(payload.code);

    const modulesToCreate = options?.modules ?? this.DEFAULT_MODULES;
    const initialSettings = options?.initialSettings ?? {};

    // Use a transaction so we don't create partial tenant state
    return await this.dataSource.transaction(async (manager) => {
      const tenantRepoTx = manager.getRepository(Tenant);
      const tenantModuleRepoTx = manager.getRepository(TenantModule);
      const tenantSettingsRepoTx = manager.getRepository(TenantSettings);

      // Create tenant
      const tenantRow = tenantRepoTx.create({
        name: payload.name,
        code: payload.code,
        contact_email: payload.contact_email,
        contact_phone: payload.contact_phone,
        country: payload.country,
        timezone: payload.timezone || 'UTC',
        industry: payload.industry,
        is_active: true,
        is_deleted: false,
      });

      const savedTenant = await tenantRepoTx.save(tenantRow);

      // Seed modules for tenant
      const createdModules = [];
      for (const m of modulesToCreate) {
        const tm = tenantModuleRepoTx.create({
          tenant_id: savedTenant.id,
          module_key: m.key,
          module_name: m.name,
          is_enabled: true,
        });
        createdModules.push(await tenantModuleRepoTx.save(tm));
      }

      // Seed tenant settings (COA template, empty dims etc)
      const settings = tenantSettingsRepoTx.create({
        tenant_id: savedTenant.id,
        chart_of_accounts: initialSettings.chart_of_accounts ?? null,
        dimensions: initialSettings.dimensions ?? null,
        tax_rules: initialSettings.tax_rules ?? null,
        workflows: initialSettings.workflows ?? null,
        expense_rules: initialSettings.expense_rules ?? null,
        ar_ap_rules: initialSettings.ar_ap_rules ?? null,
        inventory_rules: initialSettings.inventory_rules ?? null,
        currency_settings: initialSettings.currency_settings ?? null,
        ai_settings: initialSettings.ai_settings ?? null,
        document_numbering: initialSettings.document_numbering ?? null,
        additional_settings: initialSettings.additional_settings ?? null,
      });

      await tenantSettingsRepoTx.save(settings);

      // Optionally create initial admin user and assign Tenant Admin role
      let createdAdminUser: any = null;
      if (options?.initialAdmin) {
        // create user via UsersService - ensure the UsersService uses tenant-aware creation if necessary
        // Here we expect UsersService.createUser returns a sanitized user with id
        createdAdminUser = await this.usersService.createUser({
          email: options.initialAdmin.email,
          password: options.initialAdmin.password,
          first_name: options.initialAdmin.first_name,
          last_name: options.initialAdmin.last_name,
          // create tenant-user link (usersService should associate user with tenant)
          tenant_id: savedTenant.id,
        });

        // Create or get tenant_admin role (use RBAC service)
        const role = await this.rbacService.createRole(`tenant_admin_${savedTenant.code}`, `Tenant Admin for ${savedTenant.name}`).catch(() => null);

        // assign role to user in tenant context:
        // Note: usersService should create/find user_tenant row and return userTenantId
        const userTenant = await this.usersService.findOrCreateUserTenant(createdAdminUser.id, savedTenant.id);
        if (role && userTenant) {
          await this.rbacService.assignRoleToUser(userTenant.id, role.id, 'system');
        }
      }

      // Return created tenant & admin
      return {
        tenant: savedTenant,
        adminUser: createdAdminUser ? this.usersService.sanitizeUser(createdAdminUser) : undefined,
      };
    });
  }

  // ---------------------------
  // Update Tenant basic fields
  // ---------------------------
  async updateTenant(tenantId: string, patch: Partial<Tenant>): Promise<Tenant> {
    const t = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!t) throw new NotFoundException('Tenant not found');

    // disallow changing of code once created unless explicitly allowed (business decision)
    if (patch.code && patch.code !== t.code) {
      // optional: ensure unique
      await this.ensureUniqueCode(patch.code);
    }

    Object.assign(t, patch);
    return this.tenantRepo.save(t);
  }

  // ---------------------------
  // Get Tenant
  // ---------------------------
  async getTenant(tenantId: string): Promise<Tenant> {
    const t = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!t) throw new NotFoundException('Tenant not found');
    return t;
  }

  // ---------------------------
  // List tenants (paging optional)
  // ---------------------------
  async listTenants(limit = 100, offset = 0): Promise<{ total: number; rows: Tenant[] }> {
    const [rows, total] = await this.tenantRepo.findAndCount({
      take: limit,
      skip: offset,
      where: { is_deleted: false },
      order: { created_at: 'DESC' },
    });
    return { total, rows };
  }

  // ---------------------------
  // Suspend / Reactivate tenant
  // ---------------------------
  async suspendTenant(tenantId: string): Promise<Tenant> {
    const t = await this.getTenant(tenantId);
    t.is_active = false;
    return this.tenantRepo.save(t);
  }

  async reactivateTenant(tenantId: string): Promise<Tenant> {
    const t = await this.getTenant(tenantId);
    t.is_active = true;
    return this.tenantRepo.save(t);
  }

  // ---------------------------
  // Module Activation / Deactivation
  // ---------------------------

  /**
   * Activate a module for a tenant
   */
  async activateModule(tenantId: string, moduleKey: string, moduleName?: string): Promise<TenantModule> {
    // verify tenant exists
    await this.getTenant(tenantId);

    const existing = await this.tenantModuleRepo.findOne({ where: { tenant_id: tenantId, module_key: moduleKey } });
    if (existing) {
      existing.is_enabled = true;
      if (moduleName) existing.module_name = moduleName;
      return this.tenantModuleRepo.save(existing);
    }

    const row = this.tenantModuleRepo.create({
      tenant_id: tenantId,
      module_key: moduleKey,
      module_name: moduleName || moduleKey,
      is_enabled: true,
    });
    return this.tenantModuleRepo.save(row);
  }

  /**
   * Deactivate a module for a tenant (soft: keep record but set disabled)
   */
  async deactivateModule(tenantId: string, moduleKey: string): Promise<TenantModule> {
    await this.getTenant(tenantId);
    const existing = await this.tenantModuleRepo.findOne({ where: { tenant_id: tenantId, module_key: moduleKey } });
    if (!existing) throw new NotFoundException('Module not found for tenant');
    existing.is_enabled = false;
    return this.tenantModuleRepo.save(existing);
  }

  /**
   * List modules for tenant
   */
  async listTenantModules(tenantId: string): Promise<TenantModule[]> {
    await this.getTenant(tenantId);
    return this.tenantModuleRepo.find({ where: { tenant_id: tenantId } });
  }

  // ---------------------------
  // Tenant Settings management
  // ---------------------------

  /**
   * Get settings for a tenant (or null)
   */
  async getSettings(tenantId: string): Promise<TenantSettings | null> {
    await this.getTenant(tenantId);
    return this.tenantSettingsRepo.findOne({ where: { tenant_id: tenantId } });
  }

  /**
   * Upsert tenant settings
   */
  async setSettings(tenantId: string, config: Partial<TenantSettings>): Promise<TenantSettings> {
    await this.getTenant(tenantId);

    let settings = await this.tenantSettingsRepo.findOne({ where: { tenant_id: tenantId } });
    if (!settings) {
      settings = this.tenantSettingsRepo.create({ tenant_id: tenantId, ...config });
      return this.tenantSettingsRepo.save(settings);
    }

    Object.assign(settings, config);
    return this.tenantSettingsRepo.save(settings);
  }

  // ---------------------------
  // Assign Tenant Admin (existing user)
  // ---------------------------
  /**
   * Assign an existing user to tenant admin role.
   * - find or create user_tenant via UsersService
   * - create tenant specific role via RBAC service
   * - assign role to userTenant
   */
  async assignTenantAdmin(existingUserId: string, tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    // create/find user_tenant link
    const userTenant = await this.usersService.findOrCreateUserTenant(existingUserId, tenantId);

    // create/get tenant admin role
    const roleName = `tenant_admin_${tenant.code}`;
    const role = await this.rbacService.createRole(roleName, `Tenant administrator for ${tenant.name}`);

    // assign role to userTenant
    await this.rbacService.assignRoleToUser(userTenant.id, role.id, 'system');
  }

  // ---------------------------
  // Utility: validate tenant enabled for a module
  // ---------------------------
  async isModuleEnabled(tenantId: string, moduleKey: string): Promise<boolean> {
    await this.getTenant(tenantId);
    const row = await this.tenantModuleRepo.findOne({ where: { tenant_id: tenantId, module_key: moduleKey } });
    return !!row && !!row.is_enabled;
  }

  // ---------------------------
  // Admin-level: delete tenant (soft delete)
  // ---------------------------
  async softDeleteTenant(tenantId: string): Promise<void> {
    const t = await this.getTenant(tenantId);
    t.is_deleted = true;
    t.is_active = false;
    await this.tenantRepo.save(t);
    // Note: we do not cascade delete data — data remains for audit purposes.
  }
}
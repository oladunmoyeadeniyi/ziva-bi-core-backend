/**
 * UsersService
 *
 * Responsibilities:
 *  - Create / find / update users
 *  - Create / find user-tenant link (findOrCreateUserTenant)
 *  - Simple sanitization before returning user objects to controllers
 *
 * Notes:
 *  - This service uses argon2 for password hashing (install argon2 dependency in package.json)
 *  - It exposes findOrCreateUserTenant used by TenantService to link an initial admin
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as argon2 from 'argon2';

import { User } from './entities/user.entity';
import { UserTenant } from './entities/user-tenant.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserTenant) private readonly userTenantRepo: Repository<UserTenant>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a user with hashed password
   * If user already exists (by email) throws BadRequestException
   */
  async createUser(payload: {
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: any;
    tenant_id?: string; // optional: if provided, create user-tenant link too
  }): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: payload.email } });
    if (existing) throw new BadRequestException('User with this email already exists');

    const user = this.userRepo.create({
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone,
      metadata: payload.metadata || null,
      is_active: true,
      is_deleted: false,
    });

    if (payload.password) {
      const hash = await argon2.hash(payload.password);
      user.password_hash = hash;
    }

    const saved = await this.userRepo.save(user);

    // optional: create tenant link synchronously
    if (payload.tenant_id) {
      await this.findOrCreateUserTenant(saved.id, payload.tenant_id);
    }

    return saved;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  /**
   * Create or find user tenant link
   * This will return the userTenant row (tenant-scoped identity)
   */
  async findOrCreateUserTenant(userId: string, tenantId: string): Promise<UserTenant> {
    // Basic validation
    if (!userId || !tenantId) throw new BadRequestException('userId and tenantId required');

    // Try to find
    let ut = await this.userTenantRepo.findOne({ where: { user_id: userId, tenant_id: tenantId } });
    if (ut) return ut;

    // Create
    const newUt = this.userTenantRepo.create({
      user_id: userId,
      tenant_id: tenantId,
      is_active: true,
    });

    return this.userTenantRepo.save(newUt);
  }

  /**
   * Helper: sanitize user before sending to clients
   * Removes password hash and internal metadata unless requested.
   */
  sanitizeUser(user: User) {
    if (!user) return null;
    const { password_hash, is_deleted, ...rest } = user as any;
    return rest as Partial<User>;
  }

  /**
   * Update user basic profile (not password here)
   */
  async updateUser(userId: string, patch: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // don't allow email change here without additional verification
    if (patch.email && patch.email !== user.email) {
      // ensure uniqueness
      const exists = await this.userRepo.findOne({ where: { email: patch.email } });
      if (exists) throw new BadRequestException('Email already in use');
      user.email = patch.email;
    }

    user.first_name = patch.first_name ?? user.first_name;
    user.last_name = patch.last_name ?? user.last_name;
    user.phone = patch.phone ?? user.phone;
    user.metadata = patch.metadata ?? user.metadata;
    user.is_active = patch.is_active ?? user.is_active;

    return this.userRepo.save(user);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.password_hash = await argon2.hash(newPassword);
    await this.userRepo.save(user);
  }

  /**
   * Verify a plain password against stored hash (for login flow)
   */
  async verifyPassword(userId: string, candidate: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.password_hash) return false;
    try {
      return await argon2.verify(user.password_hash, candidate);
    } catch (err) {
      this.logger.error('Password verify error', err);
      return false;
    }
  }

  /**
   * List user tenants for a user
   */
  async listUserTenants(userId: string): Promise<UserTenant[]> {
    return this.userTenantRepo.find({ where: { user_id: userId } });
  }

  /**
   * Administrative: deactivate user-tenant membership
   */
  async setUserTenantActive(userTenantId: string, isActive: boolean): Promise<UserTenant> {
    const ut = await this.userTenantRepo.findOne({ where: { id: userTenantId } });
    if (!ut) throw new NotFoundException('User-Tenant link not found');
    ut.is_active = isActive;
    return this.userTenantRepo.save(ut);
  }
}
/**
 * UsersController
 *
 * Exposes minimal user management endpoints:
 * - Register (create user + optional tenant link)
 * - Get user profile (sanitized)
 * - Update profile
 * - List user-tenant links
 *
 * Security:
 * - Register may be controlled (open vs invite-only) by configuration. For now we allow simple register.
 * - Authentication guards (JWT) should protect profile endpoints — they are not wired here to keep starter deploy simple.
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Register user
   * Accepts optional tenant_id to immediately link user to tenant (used for initial tenant admin or invited users)
   */
  @Post('register')
  async register(
    @Body()
    payload: {
      email: string;
      password?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      tenant_id?: string;
    },
  ) {
    if (!payload?.email) throw new BadRequestException('email required');

    const created = await this.usersService.createUser({
      email: payload.email,
      password: payload.password,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone,
      tenant_id: payload.tenant_id,
    });

    return { success: true, data: this.usersService.sanitizeUser(created) };
  }

  /**
   * Get user profile by id (sanitized)
   * (In production this should be protected and return the current user's profile)
   */
  @Get(':userId')
  async getProfile(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: this.usersService.sanitizeUser(user) };
  }

  /**
   * Update user profile
   */
  @Patch(':userId')
  async updateProfile(@Param('userId') userId: string, @Body() patch: any) {
    const updated = await this.usersService.updateUser(userId, patch);
    return { success: true, data: this.usersService.sanitizeUser(updated) };
  }

  /**
   * List user-tenants for a user
   */
  @Get(':userId/tenants')
  async listUserTenants(@Param('userId') userId: string) {
    const rows = await this.usersService.listUserTenants(userId);
    return { success: true, data: rows };
  }
}
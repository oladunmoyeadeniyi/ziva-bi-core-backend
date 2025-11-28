// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AUTH } from '../constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTenant } from '../entities/user-tenants.entity';

/**
 * JWT Strategy:
 * - Validates JWT access tokens
 * - Loads tenant-scoped user membership (user_tenants)
 *
 * Note: The JWT payload should include: { sub: user_tenant_id, tenant: tenant_id, roles: [...], permissions: [...] }
 */

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(UserTenant)
    private readonly userTenantRepo: Repository<UserTenant>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: AUTH.ACCESS_SECRET,
    });
  }

  // When JWT is valid, this method returns the "user" attached to request
  async validate(payload: any) {
    // payload.sub is expected to be user_tenant_id (tenant-scoped membership)
    const userTenant = await this.userTenantRepo.findOne({
      where: { id: payload.sub },
    });

    if (!userTenant || !userTenant.is_active) {
      return null; // authentication fails if user not found or inactive
    }

    // return minimal user object to attach on req.user
    return {
      userTenantId: userTenant.id,
      userId: userTenant.user_id,
      tenantId: userTenant.tenant_id,
      email: userTenant.login_email,
      phone: userTenant.login_phone,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
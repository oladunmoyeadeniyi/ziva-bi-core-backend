/**
 * auth.service.ts
 *
 * Ziva BI — Authentication service (NestJS)
 *
 * Responsibilities:
 *  - Register tenant-scoped users
 *  - Password-based login (creates session + issues access & refresh tokens)
 *  - Refresh token rotation (secure, hashed)
 *  - Logout (revoke session + tokens)
 *  - OTP send & verify
 *  - Resolve roles & permissions for JWT payload
 *
 * Security & production notes (read carefully):
 *  - Refresh tokens are NEVER stored in raw form. We hash them using HMAC and store the hash.
 *  - Passwords are hashed with argon2 via HashUtil.
 *  - MFA, audit logging and provider integrations are scaffolded but should be wired to real providers in prod.
 */

import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { addDays } from 'date-fns';

import { AUTH } from './constants';
import { HashUtil } from './utils/hash.util';

// Entities (tenant-scoped location)
import { User } from './entities/users.entity';
import { UserTenant } from './entities/user-tenants.entity';
import { Session } from './entities/sessions.entity';
import { RefreshToken } from './entities/refresh-tokens.entity';
import { OtpCode } from './entities/otp-codes.entity';
import { Role } from './entities/roles.entity';
import { Permission } from './entities/permissions.entity';
import { RolePermission } from './entities/role-permissions.entity';
import { UserRole } from './entities/user-roles.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserTenant) private readonly userTenantRepo: Repository<UserTenant>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(RefreshToken) private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(OtpCode) private readonly otpRepo: Repository<OtpCode>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
    private readonly jwtService: JwtService,
  ) {}

  // ---------------------------
  // REGISTER
  //  - Create global user if missing
  //  - Create tenant membership (user_tenant) with password hash
  // ---------------------------
  async register(dto: {
    displayName: string;
    loginEmail: string;
    loginPhone?: string;
    password: string;
    tenantId: string;
  }) {
    // sanitize minimal checks
    if (!dto.tenantId) throw new BadRequestException('tenantId required');

    // (1) Find or create global user
    let globalUser = await this.userRepo.findOne({ where: { primary_email: dto.loginEmail } });
    if (!globalUser) {
      globalUser = this.userRepo.create({
        primary_email: dto.loginEmail,
        primary_phone: dto.loginPhone || null,
        display_name: dto.displayName,
      });
      globalUser = await this.userRepo.save(globalUser);
    }

    // (2) Ensure tenant membership does not already exist
    const existing = await this.userTenantRepo.findOne({
      where: { tenant_id: dto.tenantId, login_email: dto.loginEmail },
    });
    if (existing) throw new BadRequestException('User already exists for this tenant');

    // (3) Hash password & create userTenant
    const passwordHash = await HashUtil.hashPassword(dto.password);

    const userTenant = this.userTenantRepo.create({
      tenant_id: dto.tenantId,
      user_id: globalUser.id,
      login_email: dto.loginEmail,
      login_phone: dto.loginPhone || null,
      password_hash: passwordHash,
      is_active: true,
      is_email_verified: false,
    });

    const saved = await this.userTenantRepo.save(userTenant);

    // Return minimal info (do NOT auto login)
    return { userTenantId: saved.id, userId: saved.user_id };
  }

  // ---------------------------
  // LOGIN
  //  - Validate credentials
  //  - Create session
  //  - Issue access token + refresh token (raw returned)
  //  - Include roles & permissions in JWT payload
  // ---------------------------
  async login(dto: {
    loginEmail?: string;
    loginPhone?: string;
    password: string;
    tenantId: string;
    deviceFingerprint?: string | null;
  }) {
    if (!dto.tenantId) throw new BadRequestException('tenantId required');

    // find userTenant by email or phone
    const where = dto.loginEmail
      ? { tenant_id: dto.tenantId, login_email: dto.loginEmail }
      : { tenant_id: dto.tenantId, login_phone: dto.loginPhone };

    const userTenant = await this.userTenantRepo.findOne({ where });
    if (!userTenant) throw new UnauthorizedException('Invalid credentials');

    if (!userTenant.password_hash) throw new UnauthorizedException('No password configured for this account');

    const valid = await HashUtil.verifyPassword(userTenant.password_hash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!userTenant.is_active) throw new UnauthorizedException('User is disabled');

    // Create session row
    const session = this.sessionRepo.create({
      user_tenant_id: userTenant.id,
      device_fingerprint: dto.deviceFingerprint || null,
      ip_address: null,
      user_agent: null,
      last_accessed: new Date(),
      is_revoked: false,
      expires_at: null,
    });
    const savedSession = await this.sessionRepo.save(session);

    // Resolve roles & permissions for this userTenant
    const { roleNames, permissionKeys } = await this.resolveRolesAndPermissions(userTenant.id);

    // Build JWT payload
    const payload = {
      sub: userTenant.id,
      tenant: userTenant.tenant_id,
      roles: roleNames,
      permissions: permissionKeys,
    };

    const accessToken = await this.generateAccessToken(payload);
    const refreshEntry = await this.generateRefreshTokenEntry(savedSession.id);

    return {
      accessToken,
      refreshToken: refreshEntry.raw, // raw token must be stored securely by client
      refreshTokenExpiresAt: refreshEntry.expiresAt.toISOString(),
      sessionId: savedSession.id,
      userTenantId: userTenant.id,
      roles: roleNames,
      permissions: permissionKeys,
    };
  }

  // ---------------------------
  // generateAccessToken
  // ---------------------------
  async generateAccessToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: AUTH.ACCESS_SECRET,
      expiresIn: AUTH.ACCESS_EXPIRES_IN,
    });
  }

  // ---------------------------
  // generateRefreshTokenEntry
  //  - create raw token, hash it with HMAC, store the hash in DB
  // ---------------------------
  async generateRefreshTokenEntry(sessionId?: string) {
    const raw = crypto.randomBytes(64).toString('hex'); // strong random
    const hashed = HashUtil.hmac(raw, AUTH.REFRESH_HASH_SECRET);

    // Compute expiry: parse REFRESH_EXPIRES_IN (support '30d' or seconds)
    const days = parseDurationDaysToDays(AUTH.REFRESH_EXPIRES_IN || '30d');
    const expiresAt = addDays(new Date(), days);

    const rt = this.refreshRepo.create({
      session_id: sessionId || null,
      token_hash: hashed,
      issued_at: new Date(),
      expires_at: expiresAt,
      revoked_at: null,
      replaced_by: null,
    });

    const saved = await this.refreshRepo.save(rt);
    return { raw, hashed, expiresAt: saved.expires_at, id: saved.id };
  }

  // ---------------------------
  // refresh
  //  - rotate refresh token securely
  // ---------------------------
  async refresh(refreshTokenRaw: string, sessionId: string) {
    if (!refreshTokenRaw) throw new BadRequestException('refreshToken required');
    if (!sessionId) throw new BadRequestException('sessionId required');

    const hashed = HashUtil.hmac(refreshTokenRaw, AUTH.REFRESH_HASH_SECRET);
    const stored = await this.refreshRepo.findOne({ where: { token_hash: hashed } });

    if (!stored) throw new UnauthorizedException('Invalid refresh token');
    if (stored.revoked_at) throw new UnauthorizedException('Refresh token revoked');
    if (stored.expires_at < new Date()) throw new UnauthorizedException('Refresh token expired');
    if (stored.session_id !== sessionId) throw new UnauthorizedException('Session mismatch');

    // Ensure session exists and is active
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session || session.is_revoked) throw new UnauthorizedException('Session invalid');

    // Rotate: create new refresh token entry bound to same session
    const newEntry = await this.generateRefreshTokenEntry(sessionId);

    // Revoke old token & point replaced_by
    stored.revoked_at = new Date();
    stored.replaced_by = newEntry.id;
    await this.refreshRepo.save(stored);

    // Fetch userTenant for building new access token payload
    const userTenant = await this.userTenantRepo.findOne({ where: { id: session.user_tenant_id } });
    if (!userTenant) throw new NotFoundException('User session not found');

    const { roleNames, permissionKeys } = await this.resolveRolesAndPermissions(userTenant.id);
    const payload = { sub: userTenant.id, tenant: userTenant.tenant_id, roles: roleNames, permissions: permissionKeys };
    const access = await this.generateAccessToken(payload);

    return { accessToken: access, refreshToken: newEntry.raw, refreshTokenExpiresAt: newEntry.expiresAt.toISOString() };
  }

  // ---------------------------
  // logout
  //  - revoke session and all refresh tokens in that session
  // ---------------------------
  async logout(sessionId: string) {
    if (!sessionId) throw new BadRequestException('sessionId required');

    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    session.is_revoked = true;
    await this.sessionRepo.save(session);

    await this.refreshRepo.update({ session_id: sessionId }, { revoked_at: new Date() });

    return { ok: true };
  }

  // ---------------------------
  // sendOtp
  //  - generate OTP, store hashed, and return raw for dev/testing (in prod, send via provider)
  // ---------------------------
  async sendOtp(tenantId: string, subject: string, purpose = 'login', ttlSeconds = 300) {
    if (!tenantId) throw new BadRequestException('tenantId required');
    if (!subject) throw new BadRequestException('subject required');

    const code = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit numeric
    const codeHash = HashUtil.hmacOtp(code, AUTH.OTP_HASH_SECRET);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const otpRow = this.otpRepo.create({
      tenant_id: tenantId,
      subject,
      purpose,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: 5,
    });

    await this.otpRepo.save(otpRow);

    // TODO: integrate with SMS/Email provider (SendGrid/Twilio). For now return code (remove in prod).
    return { rawCode: code, expiresAt: expiresAt.toISOString() };
  }

  // ---------------------------
  // verifyOtp
  // ---------------------------
  async verifyOtp(tenantId: string, subject: string, purpose: string, presentedCode: string) {
    if (!tenantId || !subject || !purpose || !presentedCode) {
      throw new BadRequestException('missing parameters');
    }

    const otp = await this.otpRepo.findOne({
      where: { tenant_id: tenantId, subject, purpose, consumed_at: null, expires_at: MoreThan(new Date()) },
      order: { created_at: 'DESC' },
    });

    if (!otp) throw new NotFoundException('OTP not found or expired');

    if (otp.attempts >= otp.max_attempts) throw new UnauthorizedException('OTP locked due to failed attempts');

    const presentedHash = HashUtil.hmacOtp(presentedCode, AUTH.OTP_HASH_SECRET);
    if (presentedHash !== otp.code_hash) {
      otp.attempts = otp.attempts + 1;
      await this.otpRepo.save(otp);
      throw new UnauthorizedException('Invalid code');
    }

    otp.consumed_at = new Date();
    await this.otpRepo.save(otp);
    return { ok: true };
  }

  // ---------------------------
  // resolveRolesAndPermissions
  //  - Given a user_tenant_id, find roles assigned and aggregate permissions
  // ---------------------------
  private async resolveRolesAndPermissions(userTenantId: string) {
    // fetch userRoles rows for this userTenant
    const userRoles = await this.userRoleRepo.find({ where: { user_tenant_id: userTenantId } });
    if (!userRoles || userRoles.length === 0) return { roleNames: [], permissionKeys: [] };

    const roleIds = userRoles.map((ur) => ur.role_id);

    // fetch role names
    const roles = await this.roleRepo.findByIds(roleIds);
    const roleNames = roles.map((r) => r.name);

    // fetch role-permission mapping
    const rolePerms = await this.rolePermRepo.find({ where: { role_id: roleIds } });
    const permissionIds = Array.from(new Set(rolePerms.map((rp) => rp.permission_id)));

    if (permissionIds.length === 0) return { roleNames, permissionKeys: [] };

    // fetch permission keys
    const perms = await this.permissionRepo.findByIds(permissionIds);
    const permissionKeys = perms.map((p) => p.key);

    return { roleNames, permissionKeys };
  }
}

/* ---------------------------
   Helper utilities (private to file)
   - parseDurationDaysToDays
----------------------------*/
function parseDurationDaysToDays(str: string) {
  if (!str) return 30;
  const s = str.trim().toLowerCase();
  if (s.endsWith('d')) {
    const n = parseInt(s.slice(0, -1), 10);
    return Number.isNaN(n) ? 30 : n;
  }
  if (s.endsWith('s')) {
    const sec = parseInt(s.slice(0, -1), 10);
    return Number.isNaN(sec) ? 30 : Math.ceil(sec / 86400);
  }
  // default numeric days or fallback
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 30 : n;
}
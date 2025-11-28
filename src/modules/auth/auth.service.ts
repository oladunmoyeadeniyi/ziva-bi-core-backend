// auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/users.entity';
import { UserTenant } from '../entities/user-tenants.entity';
import { Session } from '../entities/sessions.entity';
import { RefreshToken } from '../entities/refresh-tokens.entity';
import { OtpCode } from '../entities/otp-codes.entity';
import { HashUtil } from './utils/hash.util';
import { AUTH } from './constants';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Add } from 'typescript';

/**
 * AuthService - core auth business logic.
 *
 * IMPORTANT SECURITY NOTES (read carefully):
 * - Never return raw refresh tokens from DB.
 * - When issuing refresh token: generate cryptographically secure string (randomBytes), send raw to client,
 *   store HMAC(token, REFRESH_HASH_SECRET) in DB for lookup.
 * - On refresh: hash presented token and query DB; perform rotation: issue new token, mark old token's replaced_by.
 * - Log all security actions to audit_logs (not shown here — add in production).
 */

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserTenant) private userTenantRepo: Repository<UserTenant>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(RefreshToken) private refreshRepo: Repository<RefreshToken>,
    @InjectRepository(OtpCode) private otpRepo: Repository<OtpCode>,
    private readonly jwtService: JwtService,
  ) {}

  /* ------------------------------
     REGISTER: tenant-scoped user
     - creates global user if none
     - creates user_tenant membership (with password hash)
     - returns tenant-scoped user id (or minimal user)
  --------------------------------*/
  async register(dto: RegisterDto) {
    // validation: ensure tenant exists externally (tenant entity check omitted here)
    // Find or create global user
    let globalUser = await this.userRepo.findOne({ where: { primary_email: dto.loginEmail } });
    if (!globalUser) {
      globalUser = this.userRepo.create({
        primary_email: dto.loginEmail,
        primary_phone: dto.loginPhone,
        display_name: dto.displayName,
      });
      await this.userRepo.save(globalUser);
    }

    // Create tenant membership
    const existing = await this.userTenantRepo.findOne({
      where: { tenant_id: dto.tenantId, login_email: dto.loginEmail },
    });
    if (existing) {
      throw new BadRequestException('User already exists for this tenant');
    }

    const passwordHash = await HashUtil.hashPassword(dto.password);

    const userTenant = this.userTenantRepo.create({
      tenant_id: dto.tenantId,
      user_id: globalUser.id,
      login_email: dto.loginEmail,
      login_phone: dto.loginPhone,
      password_hash: passwordHash,
      is_active: true,
      is_email_verified: false,
    });

    const saved = await this.userTenantRepo.save(userTenant);

    // Return minimal info (do NOT auto-login here)
    return { userTenantId: saved.id, userId: saved.user_id };
  }

  /* ------------------------------
     LOGIN: password-based login
     - validates tenant-scoped credentials
     - creates session, issues access + refresh token
  --------------------------------*/
  async login(dto: LoginDto) {
    // Find userTenant by email or phone within tenant
    const where = dto.loginEmail ? { tenant_id: dto.tenantId, login_email: dto.loginEmail } : { tenant_id: dto.tenantId, login_phone: dto.loginPhone };
    const userTenant = await this.userTenantRepo.findOne({ where });

    if (!userTenant) throw new UnauthorizedException('Invalid credentials');

    if (!userTenant.password_hash) throw new UnauthorizedException('No password configured for this account');

    const valid = await HashUtil.verifyPassword(userTenant.password_hash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!userTenant.is_active) throw new UnauthorizedException('User is disabled');

    // Create session
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

    // Compose JWT payload
    const payload = {
      sub: userTenant.id,
      tenant: userTenant.tenant_id,
      // Roles & permissions balanced: we will fetch user roles & permissions (omitted here for brevity)
      roles: [], // placeholder
      permissions: [], // placeholder
    };

    // generate tokens
    const accessToken = await this.generateAccessToken(payload);
    const { raw: refreshRaw, hashed: refreshHash, expiresAt } = await this.generateRefreshTokenEntry(savedSession.id);

    return {
      accessToken,
      refreshToken: refreshRaw,
      refreshTokenExpiresAt: expiresAt.toISOString(),
      sessionId: savedSession.id,
    };
  }

  /* ------------------------------
     Access token generation (JWT)
  --------------------------------*/
  async generateAccessToken(payload: any) {
    // sign with JWT access secret
    return this.jwtService.sign(payload, {
      secret: AUTH.ACCESS_SECRET,
      expiresIn: AUTH.ACCESS_EXPIRES_IN,
    });
  }

  /* ------------------------------
     Refresh token generation & storage
     - returns { raw, hashed, expiresAt }
  --------------------------------*/
  async generateRefreshTokenEntry(sessionId?: string) {
    // generate strong random token (64 bytes hex)
    const raw = cryptoRandomHex(64);
    const hashed = HashUtil.hmac(raw, AUTH.REFRESH_HASH_SECRET);
    const expiresAt = addDays(new Date(), parseDurationDays(AUTH.REFRESH_EXPIRES_IN));

    const rt = this.refreshRepo.create({
      session_id: sessionId,
      token_hash: hashed,
      issued_at: new Date(),
      expires_at: expiresAt,
      revoked_at: null,
      replaced_by: null,
    });

    const saved = await this.refreshRepo.save(rt);
    return { raw, hashed, expiresAt: saved.expires_at, id: saved.id };
  }

  /* ------------------------------
     Refresh flow (rotation)
     - verify presented token (hash lookup)
     - issue new refresh token & revoke old one (set replaced_by)
     - return new access token + new refresh raw
  --------------------------------*/
  async refresh(refreshTokenRaw: string, sessionId: string) {
    const hashed = HashUtil.hmac(refreshTokenRaw, AUTH.REFRESH_HASH_SECRET);
    const stored = await this.refreshRepo.findOne({ where: { token_hash: hashed } });

    if (!stored) throw new UnauthorizedException('Invalid refresh token');
    if (stored.revoked_at) throw new UnauthorizedException('Refresh token revoked');
    if (stored.expires_at < new Date()) throw new UnauthorizedException('Refresh token expired');
    if (stored.session_id !== sessionId) throw new UnauthorizedException('Session mismatch');

    // Rotate: create new RT, mark old replaced_by & revoked_at
    const { raw: newRaw, hashed: newHash, expiresAt } = await this.generateRefreshTokenEntry(sessionId);

    stored.revoked_at = new Date();
    // find saved new token id (by hashed). But we returned id earlier if needed.
    // For simplicity: update replaced_by AFTER saving new token; below we saved new and then update old replaced_by
    const newToken = await this.refreshRepo.findOne({ where: { token_hash: newHash } });

    stored.replaced_by = newToken ? newToken.id : null;
    await this.refreshRepo.save(stored);

    // produce access token; payload should come from session -> userTenant
    // For simplicity we'll load userTenant
    const userTenant = await this.userTenantRepo.findOne({ where: { id: sessionId ? (await this.sessionRepo.findOne({ where: { id: sessionId } })).user_tenant_id : null }});
    if (!userTenant) throw new NotFoundException('Session user not found');

    const payload = { sub: userTenant.id, tenant: userTenant.tenant_id, roles: [], permissions: [] };
    const access = await this.generateAccessToken(payload);

    return { accessToken: access, refreshToken: newRaw, refreshTokenExpiresAt: expiresAt.toISOString() };
  }

  /* ------------------------------
     Logout: revoke session + all refresh tokens for session
  --------------------------------*/
  async logout(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    session.is_revoked = true;
    await this.sessionRepo.save(session);

    // Revoke refresh tokens for this session
    await this.refreshRepo.update({ session_id: sessionId }, { revoked_at: new Date() });

    return { ok: true };
  }

  /* ------------------------------
     OTP: send and verify (basic)
     - sendOtp: create hashed OTP row and returns raw (in prod send via email/SMS)
  --------------------------------*/
  async sendOtp(tenantId: string, subject: string, purpose = 'login', ttlSeconds = 300) {
    // generate 6-digit numeric code
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
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

    // NOTE: send code via provider e.g., SendGrid or Twilio (omitted)
    // For testing return the raw code (remove in production)
    return { rawCode: code, expiresAt: expiresAt.toISOString() };
  }

  async verifyOtp(tenantId: string, subject: string, purpose: string, presentedCode: string) {
    // find latest non-consumed OTP for subject/purpose
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

    // success
    otp.consumed_at = new Date();
    await this.otpRepo.save(otp);
    return { ok: true };
  }
}

/* -------------------------
   Helper functions below
   - tiny helpers: random hex, addDays, parse duration
---------------------------*/
import * as crypto from 'crypto';
import { addDays as _addDays } from 'date-fns';
import { MoreThan } from 'typeorm';

function cryptoRandomHex(bytes = 64) {
  return crypto.randomBytes(bytes).toString('hex');
}

function addDays(d: Date, days: number) {
  return _addDays(d, days);
}

/**
 * parseDurationDays accepts formats like:
 *  - '30d' => 30
 *  - '30' => 30
 *  - '2592000s' (seconds) => convert to days
 */
function parseDurationDays(str: string) {
  if (!str) return 30;
  if (str.endsWith('d')) return parseInt(str.slice(0, -1), 10);
  if (str.endsWith('s')) {
    const seconds = parseInt(str.slice(0, -1), 10);
    return Math.ceil(seconds / 86400);
  }
  return parseInt(str, 10) || 30;
}
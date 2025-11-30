/**
 * AuthService (REFRESH-ID approach)
 *
 * Key differences vs earlier implementation:
 * - Refresh tokens contain `refresh_db_id` (the UUID primary key of refresh_tokens row).
 * - On login:
 *     1) create a refresh DB row (without token_hash yet)
 *     2) sign refreshToken = JWT({ sub, refresh_db_id: saved.id }, refreshSecret)
 *     3) hash the plain refreshToken and update the DB row token_hash
 * - On rotate:
 *     1) verify refresh token signature (using refresh secret)
 *     2) extract refresh_db_id and load DB row by id
 *     3) ensure not revoked and not expired
 *     4) revoke old row and create new row (same flow as login)
 *
 * This allows constant-time lookup and robust revocation/rotation.
 */

import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';

import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpCode } from './entities/otp-code.entity';
import { Session } from './entities/session.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,

    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,

    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,

    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  // -------------------------
  // Utility: token creation
  // -------------------------
  private createAccessToken(payload: any) {
    const secret = this.config.get<string>('JWT_ACCESS_TOKEN_SECRET');
    const expiresIn = this.config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') || '15m';
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  private signRefreshToken(payload: any) {
    const secret = this.config.get<string>('JWT_REFRESH_TOKEN_SECRET');
    const expiresIn = this.config.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') || '30d';
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  private computeRefreshExpiry(): Date {
    const qty = this.config.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') || '30d';
    const v = qty.toLowerCase();
    const now = new Date();
    if (v.endsWith('d')) {
      const days = parseInt(v.slice(0, -1), 10);
      return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
    if (v.endsWith('h')) {
      const hrs = parseInt(v.slice(0, -1), 10);
      return new Date(now.getTime() + hrs * 60 * 60 * 1000);
    }
    if (v.endsWith('m')) {
      const mins = parseInt(v.slice(0, -1), 10);
      return new Date(now.getTime() + mins * 60 * 1000);
    }
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // -------------------------
  // Register
  // -------------------------
  async register(data: {
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    tenant_id?: string;
  }) {
    const user = await this.usersService.createUser({
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      tenant_id: data.tenant_id,
    });

    return this.usersService.sanitizeUser(user);
  }

  // -------------------------
  // Login
  // -------------------------
  /**
   * Login flow:
   *  - verify credentials
   *  - create refresh DB row (no token_hash)
   *  - sign refresh token including refresh_db_id
   *  - hash refresh token and update DB row.token_hash
   *  - create session and return access & refresh tokens
   */
  async login({
    email,
    password,
    tenant_id,
    ip,
    user_agent,
  }: {
    email: string;
    password: string;
    tenant_id?: string;
    ip?: string;
    user_agent?: string;
  }) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await this.usersService.verifyPassword(user.id, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    let userTenantRow = null;
    if (tenant_id) {
      userTenantRow = await this.usersService.findOrCreateUserTenant(user.id, tenant_id);
    }

    const payloadAccess: any = {
      sub: user.id,
      email: user.email,
      userTenantId: userTenantRow ? userTenantRow.id : undefined,
    };

    // 1) create refresh DB row (we need the saved id to embed in JWT)
    const refreshRow = this.refreshRepo.create({
      user_tenant_id: userTenantRow ? userTenantRow.id : null,
      revoked: false,
      expires_at: this.computeRefreshExpiry(),
      token_hash: null, // placeholder; will update after signing
    });

    const savedRefresh = await this.refreshRepo.save(refreshRow);

    // 2) sign refresh token embedding the DB id
    const refreshTokenPlain = this.signRefreshToken({
      sub: user.id,
      refresh_db_id: savedRefresh.id,
    });

    // 3) hash refreshToken and update row
    const tokenHash = await argon2.hash(refreshTokenPlain);
    savedRefresh.token_hash = tokenHash;
    await this.refreshRepo.save(savedRefresh);

    // 4) create session row and link refresh token
    const sessionRow = this.sessionRepo.create({
      user_tenant_id: userTenantRow ? userTenantRow.id : null,
      ip,
      user_agent,
      refresh_token_id: savedRefresh.id,
      active: true,
    });
    const savedSession = await this.sessionRepo.save(sessionRow);

    // 5) create access token
    const accessToken = this.createAccessToken(payloadAccess);

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      refreshTokenId: savedRefresh.id,
      sessionId: savedSession.id,
    };
  }

  // -------------------------
  // Rotate Refresh Token
  // -------------------------
  /**
   * rotateRefreshToken:
   *  - verify token signature (refresh secret)
   *  - extract refresh_db_id
   *  - find DB row by id => O(1)
   *  - check revoked / expired
   *  - revoke old row, create new row & token (same flow as login)
   */
  async rotateRefreshToken({
    oldRefreshToken,
    ip,
    user_agent,
  }: {
    oldRefreshToken: string;
    ip?: string;
    user_agent?: string;
  }) {
    // verify signature first (throws if invalid)
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshDbId = payload.refresh_db_id;
    const userId = payload.sub;
    if (!refreshDbId || !userId) {
      throw new UnauthorizedException('Malformed refresh token');
    }

    const dbRow = await this.refreshRepo.findOne({ where: { id: refreshDbId } });

    if (!dbRow) {
      throw new UnauthorizedException('Refresh token record not found');
    }

    if (dbRow.revoked) {
      // token reuse attack — revoke all sessions for this user's tenant (optional)
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (dbRow.expires_at && new Date(dbRow.expires_at) < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // OPTIONAL: verify stored token_hash matches the provided token (detect copied tokens)
    try {
      const ok = dbRow.token_hash ? await argon2.verify(dbRow.token_hash, oldRefreshToken) : false;
      if (!ok) {
        // either tokens don't match or hash missing -> treat as invalid
        throw new UnauthorizedException('Refresh token verification failed');
      }
    } catch (err) {
      throw new UnauthorizedException('Refresh token verification failed');
    }

    // Revoke old DB row
    dbRow.revoked = true;
    await this.refreshRepo.save(dbRow);

    // Create new refresh DB row
    const newRow = this.refreshRepo.create({
      user_tenant_id: dbRow.user_tenant_id ?? null,
      revoked: false,
      expires_at: this.computeRefreshExpiry(),
      token_hash: null,
    });
    const savedNewRow = await this.refreshRepo.save(newRow);

    // Sign new refresh token containing new DB id
    const newRefreshPlain = this.signRefreshToken({ sub: userId, refresh_db_id: savedNewRow.id });

    // Hash and update DB
    savedNewRow.token_hash = await argon2.hash(newRefreshPlain);
    await this.refreshRepo.save(savedNewRow);

    // Update session to point to new refresh token id (if session exists)
    const session = await this.sessionRepo.findOne({ where: { refresh_token_id: dbRow.id } });
    if (session) {
      session.refresh_token_id = savedNewRow.id;
      session.ip = ip ?? session.ip;
      session.user_agent = user_agent ?? session.user_agent;
      await this.sessionRepo.save(session);
    }

    // Create new access token payload (we include userTenantId for RBAC)
    const user = await this.usersService.findById(userId);
    const accessPayload: any = {
      sub: user.id,
      email: user.email,
      userTenantId: dbRow.user_tenant_id ?? undefined,
    };
    const newAccess = this.createAccessToken(accessPayload);

    return { accessToken: newAccess, refreshToken: newRefreshPlain };
  }

  // -------------------------
  // Logout
  // -------------------------
  /**
   * logout:
   *  - verify refresh token signature
   *  - extract refresh_db_id, set revoked = true
   *  - deactivate session linked to token
   */
  async logout({ refreshToken }: { refreshToken: string }) {
    if (!refreshToken) return;

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch (err) {
      // token is invalid — nothing further to do
      return;
    }

    const refreshDbId = payload.refresh_db_id;
    if (!refreshDbId) return;

    const row = await this.refreshRepo.findOne({ where: { id: refreshDbId } });
    if (!row) return;

    row.revoked = true;
    await this.refreshRepo.save(row);

    // deactivate session
    const session = await this.sessionRepo.findOne({ where: { refresh_token_id: row.id } });
    if (session) {
      session.active = false;
      await this.sessionRepo.save(session);
    }
  }

  // -------------------------
  // OTP functions (unchanged)
  // -------------------------
  async generateOtp({ subject, purpose, tenant_id }: { subject: string; purpose: string; tenant_id?: string }) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const minutes = parseInt(this.config.get<string>('OTP_EXPIRY_MINUTES') || '30', 10);
    const expires_at = addMinutes(new Date(), minutes);

    const otpRow = this.otpRepo.create({
      tenant_id,
      subject,
      code,
      purpose,
      expires_at,
    });

    const saved = await this.otpRepo.save(otpRow);

    // Hook to real sender (email/SMS) should be called here.
    this.logger.log(`OTP for ${subject} (${purpose}) => ${code} (expires ${expires_at.toISOString()})`);
    return { id: saved.id, code }; // returning code only for dev/testing
  }

  async verifyOtp({ subject, purpose, code }: { subject: string; purpose: string; code: string }) {
    const row = await this.otpRepo.findOne({
      where: { subject, purpose, consumed_at: null },
      order: { created_at: 'DESC' },
    });

    if (!row) throw new BadRequestException('OTP not found');
    if (new Date(row.expires_at) < new Date()) throw new BadRequestException('OTP expired');
    if (row.code !== code) throw new BadRequestException('Invalid OTP');

    row.consumed_at = new Date();
    await this.otpRepo.save(row);
    return true;
  }
}
// src/modules/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { hashPassword, verifyPassword } from './utils/hash.util';
import { AUTH_CONFIG } from './constants';
import * as jwt from 'jsonwebtoken';
import { addDays } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(RefreshToken) private refreshRepo: Repository<RefreshToken>,
  ) {}

  /**
   * Register a new user
   */
  async register(email: string, name: string, password: string): Promise<Partial<User>> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }
    const password_hash = await hashPassword(password);
    const user = await this.usersService.create({ email, name, password_hash, isActive: true });
    return { id: user.id, email: user.email, name: user.name };
  }

  /**
   * Validate credentials and return tokens
   */
  async login(email: string, password: string, device?: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await verifyPassword(user.password_hash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokensForUser(user, device);
    return tokens;
  }

  private signAccessToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.JWT_ACCESS_EXPIRY });
  }

  private async generateTokensForUser(user: User, device?: string) {
    const accessToken = this.signAccessToken(user);
    const refreshTokenValue = jwt.sign({ sub: user.id, email: user.email, device }, AUTH_CONFIG.JWT_SECRET, {
      expiresIn: AUTH_CONFIG.JWT_REFRESH_EXPIRY,
    });

    const expiresAt = addDays(new Date(), AUTH_CONFIG.REFRESH_TOKEN_TTL_DAYS);

    const rt = this.refreshRepo.create({
      user,
      token: refreshTokenValue,
      expires_at: expiresAt,
      created_by_ip: device,
    });
    await this.refreshRepo.save(rt);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresAt,
    };
  }

  /**
   * Use refresh token to issue a new access token
   */
  async refresh(refreshToken: string) {
    // validate token
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, AUTH_CONFIG.JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // find stored refresh token
    const rt = await this.refreshRepo.findOne({ where: { token: refreshToken }, relations: ['user'] });
    if (!rt) throw new UnauthorizedException('Refresh token not found');

    // issue new access token
    const user = rt.user;
    const accessToken = this.signAccessToken(user);
    return { accessToken };
  }

  /**
   * Logout: delete refresh token
   */
  async revokeRefreshToken(refreshToken: string) {
    await this.refreshRepo.delete({ token: refreshToken });
    return true;
  }
}

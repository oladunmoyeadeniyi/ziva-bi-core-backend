/**
 * auth.controller.ts
 *
 * Routes:
 *  - POST /auth/register
 *  - POST /auth/login
 *  - POST /auth/refresh
 *  - POST /auth/logout  (protected)
 *  - POST /auth/otp/request
 *  - POST /auth/otp/verify
 */

import { Body, Controller, Post, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  /**
   * Register a tenant-scoped user.
   * Note: tenant creation is out of scope here. tenantId must be provided.
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.svc.register(dto);
  }

  /**
   * Login with password (email/phone + password + tenantId).
   * Returns accessToken, refreshToken (raw), sessionId and meta.
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.svc.login(dto);
  }

  /**
   * Rotate refresh token.
   * Body: { refreshToken, sessionId }
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.svc.refresh(dto.refreshToken, dto.sessionId);
  }

  /**
   * Logout (protected).
   * Body should include sessionId (or sessionId can be derived from request in other designs).
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    // Expect body or user to contain sessionId; require explicit sessionId for safety.
    const sessionId = req.body?.sessionId;
    if (!sessionId) throw new BadRequestException('sessionId required to logout');

    return this.svc.logout(sessionId);
  }

  /**
   * Request OTP for a subject (email or phone).
   * Returns raw code for dev/testing. In production integrate SMS/Email provider and do not return raw code.
   */
  @Post('otp/request')
  async otpRequest(@Body() body: { tenantId: string; subject: string; purpose?: string }) {
    const { tenantId, subject, purpose } = body;
    return this.svc.sendOtp(tenantId, subject, purpose || 'login');
  }

  /**
   * Verify OTP submitted by user
   */
  @Post('otp/verify')
  async otpVerify(@Body() body: { tenantId: string; subject: string; purpose: string; code: string }) {
    const { tenantId, subject, purpose, code } = body;
    return this.svc.verifyOtp(tenantId, subject, purpose, code);
  }
}
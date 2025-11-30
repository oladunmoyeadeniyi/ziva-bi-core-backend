import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OtpGenerateDto, OtpVerifyDto } from './dto/otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user.
   * Body: { email, password, first_name, last_name, tenant_id? }
   * Returns sanitized user (no password)
   */
  @Post('register')
  async register(@Body() payload: RegisterDto) {
    const user = await this.authService.register(payload);
    return { success: true, user };
  }

  /**
   * Login
   * Body: { email, password, tenant_id? }
   * Returns accessToken & refreshToken
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() payload: LoginDto) {
    const { email, password, tenant_id, ip, user_agent } = payload as any;
    const result = await this.authService.login({
      email,
      password,
      tenant_id,
      ip: ip || null,
      user_agent: user_agent || null,
    });

    // IMPORTANT: for browser clients you may want to set refresh token as secure HttpOnly cookie.
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
      },
    };
  }

  /**
   * Refresh (rotate) tokens.
   * Body: { refreshToken }
   */
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() payload: RefreshDto) {
    const { refreshToken, ip, user_agent } = payload as any;
    const result = await this.authService.rotateRefreshToken({
      oldRefreshToken: refreshToken,
      ip: ip || null,
      user_agent: user_agent || null,
    });
    return { success: true, ...result };
  }

  /**
   * Logout: revoke refresh token (body contains refreshToken).
   */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() payload: RefreshDto) {
    await this.authService.logout({ refreshToken: payload.refreshToken });
    return { success: true, message: 'Logged out' };
  }

  /**
   * OTP: generate code
   */
  @Post('otp/generate')
  async generateOtp(@Body() payload: OtpGenerateDto) {
    const { subject, purpose, tenant_id } = payload as any;
    const rv = await this.authService.generateOtp({ subject, purpose, tenant_id });
    // For production: do not return code in body. Here returned for dev/testing.
    return { success: true, id: rv.id, code: rv.code };
  }

  /**
   * OTP: verify
   */
  @Post('otp/verify')
  async verifyOtp(@Body() payload: OtpVerifyDto) {
    const { subject, purpose, code } = payload as any;
    const ok = await this.authService.verifyOtp({ subject, purpose, code });
    return { success: true, verified: ok };
  }

  /**
   * Get current user (protected)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // req.user populated by JwtStrategy
    return { success: true, user: req.user };
  }

  /**
   * List sessions for user (optional: admin can list all)
   */
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async sessions(@Req() req: any, @Query('active') active?: string) {
    // Implement simple session listing via AuthService if desired
    // We'll return basic session list of current userTenant
    const userTenantId = req.user.userTenantId ?? null;
    // authService should implement listSessions(userTenantId)
    // If not implemented replace with empty array
    if (!this.authService['listSessions']) {
      return { success: true, sessions: [] };
    }
    const sessions = await this.authService['listSessions']({ userTenantId, active });
    return { success: true, sessions };
  }

  /**
   * Revoke session by id (body = { sessionId })
   * This endpoint is optional. Implement via authService.revokeSession(sessionId)
   */
  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke')
  async revokeSession(@Body('sessionId') sessionId: string) {
    if (!this.authService['revokeSession']) {
      return { success: false, message: 'Not implemented' };
    }
    await this.authService['revokeSession'](sessionId);
    return { success: true, message: 'Session revoked' };
  }
}
// auth.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.svc.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.svc.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.svc.refresh(dto.refreshToken, dto.sessionId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    // req.user.userTenantId expected from JwtStrategy (sub)
    const sessionId = req.body.sessionId || req.user.sessionId;
    // If session id is not provided, allow logout by sessionId param
    if (!sessionId) throw new BadRequestException('sessionId required');
    return this.svc.logout(sessionId);
  }

  @Post('otp/request')
  async otpRequest(@Body() body: { tenantId: string; subject: string; purpose?: string }) {
    return this.svc.sendOtp(body.tenantId, body.subject, body.purpose || 'login');
  }

  @Post('otp/verify')
  async otpVerify(@Body() body: { tenantId: string; subject: string; purpose: string; code: string }) {
    return this.svc.verifyOtp(body.tenantId, body.subject, body.purpose, body.code);
  }
}
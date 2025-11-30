// src/modules/auth/auth.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body.email, body.name, body.password);
    return { success: true, user };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const tokens = await this.authService.login(body.email, body.password, body.device);
    return tokens;
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const tokens = await this.authService.refresh(refreshToken);
    return tokens;
  }

  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  // example protected route to validate guard
  @UseGuards(JwtAuthGuard)
  @Post('whoami')
  whoami(@Req() req: any) {
    return { user: req.user };
  }
}

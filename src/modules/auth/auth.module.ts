import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { Users } from './entities/users.entity';
import { UserTenant } from './entities/user-tenant.entity';
import { Session } from './entities/session.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpCode } from './entities/otp-code.entity';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      UserTenant,
      Session,
      RefreshToken,
      OtpCode,
    ]),

    // 🔐 JWT configuration
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
  ],

  // Export for RBAC and other modules
  exports: [
    JwtAuthGuard,
    AuthService,
  ],
})
export class AuthModule {}
// auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entities
import { User } from './entities/users.entity';
import { UserTenant } from './entities/user-tenants.entity';
import { Session } from './entities/sessions.entity';
import { RefreshToken } from './entities/refresh-tokens.entity';
import { OtpCode } from './entities/otp-codes.entity';

// Services/Controllers/Strategies
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AUTH } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTenant, Session, RefreshToken, OtpCode]),
    JwtModule.register({
      secret: AUTH.ACCESS_SECRET,
      signOptions: { expiresIn: AUTH.ACCESS_EXPIRES_IN },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
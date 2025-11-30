import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { RefreshToken } from './entities/refresh-token.entity';
import { OtpCode } from './entities/otp-code.entity';
import { Session } from './entities/session.entity';

import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module'; // ensure you have UsersModule

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([RefreshToken, OtpCode, Session]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') || '15m' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule), // circular in some architectures
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
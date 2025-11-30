// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_CONFIG } from '../constants';
import { UsersService } from './users.service';

/**
 * JWT Strategy for Access tokens
 * Validates token, loads user from DB and attaches to request.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: AUTH_CONFIG.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Payload expected to have { sub: userId, email }
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token: user not found or inactive');
    }
    // Return minimal public user object
    return { id: user.id, email: user.email, name: user.name };
  }
}

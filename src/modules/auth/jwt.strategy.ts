/**
 * JWT Strategy (Passport)
 *
 * Validates access token. Exposes payload as request.user.
 * Payload will include:
 *  - sub (user id)
 *  - userTenantId (optional)
 *  - email
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: any) {
    /**
     * Attach payload to request.user
     * - client code expects { sub, email, userTenantId?, iat, exp }
     */
    return payload;
  }
}
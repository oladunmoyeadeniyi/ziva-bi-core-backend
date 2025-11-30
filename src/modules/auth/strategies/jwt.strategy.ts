import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService, private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  /**
   * Validate is called after the token is verified.
   * We fetch user basic profile to attach to req.user for controllers.
   */
  async validate(payload: any) {
    // payload.sub === userId
    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;
    // We may return sanitized user + tenant context (userTenantId)
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      userTenantId: payload.userTenantId ?? null,
      roles: user.roles ?? [],
    };
  }
}
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Simple wrapper for Passport JWT guard
 * Use on routes that require access token (Bearer)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // You can override handleRequest to add logging or custom errors
  handleRequest(err, user, info) {
    if (err || !user) {
      // Let Nest handle throwing UnauthorizedException for you
      return null;
    }
    return user;
  }
}
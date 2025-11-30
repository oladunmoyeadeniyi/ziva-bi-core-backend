/**
 * JwtAuthGuard
 *
 * Thin wrapper around Passport's 'jwt' strategy so we can use:
 *   @UseGuards(JwtAuthGuard)
 *
 * The guard ensures:
 *  - Authorization header exists with Bearer token
 *  - Token is valid & not expired
 *  - req.user is populated by JwtStrategy.validate()
 *
 * If you want role-based checks, combine this guard with an RBAC guard.
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // You can override handleRequest() to customize error messages / behavior
  // but the default is sufficient for now.
  canActivate(context: ExecutionContext) {
    // Optionally add custom pre-checks here (e.g. header presence)
    return super.canActivate(context);
  }
}
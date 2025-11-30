// src/modules/auth/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — wraps passport-jwt
 * Use with `@UseGuards(JwtAuthGuard)` to protect routes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Optionally override handleRequest to add custom behavior
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // default behavior (throw automatic 401)
    return super.handleRequest(err, user, info, context);
  }
}

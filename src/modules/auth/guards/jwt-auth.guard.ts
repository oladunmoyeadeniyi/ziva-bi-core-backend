// jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Simple wrapper guard to use @UseGuards(JwtAuthGuard)
 * Passport's JWT strategy name is 'jwt' (set in JwtStrategy).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
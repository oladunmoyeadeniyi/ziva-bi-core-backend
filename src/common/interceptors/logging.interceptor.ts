import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * LoggingInterceptor
 * Logs all incoming requests and execution time.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();

    console.log(
      `[Request] ${req.method} ${req.url} at ${new Date().toISOString()}`,
    );

    return next.handle().pipe(
      tap(() =>
        console.log(
          `[Response] ${req.method} ${req.url} completed in ${
            Date.now() - now
          }ms`,
        ),
      ),
    );
  }
}

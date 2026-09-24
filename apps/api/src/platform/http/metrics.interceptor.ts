import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs';
import { httpRequests } from '../telemetry/metrics';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    return next.handle().pipe(
      tap({
        next: () => {
          httpRequests.inc({
            method: req.method,
            route: req.route?.path ?? req.path,
            status: String(res.statusCode),
          });
        },
        error: () => {
          httpRequests.inc({
            method: req.method,
            route: req.route?.path ?? req.path,
            status: String(res.statusCode || 500),
          });
        },
      }),
    );
  }
}

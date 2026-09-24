import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../shared/domain-error';
import { currentCorrelationId } from '../context/request-context';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const correlationId = currentCorrelationId();

    if (exception instanceof DomainError) {
      response.status(exception.status).json({ error: { code: exception.code, message: exception.message, correlationId } });
      return;
    }

    if (exception instanceof ZodError) {
      response.status(400).json({
        error: { code: 'validation', message: exception.issues[0]?.message ?? 'Invalid request', correlationId },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : 'Request failed';
      response.status(status).json({ error: { code: status === 429 ? 'rate_limited' : 'http_error', message, correlationId } });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(500).json({
      error: {
        code: 'internal',
        message: process.env.NODE_ENV === 'test' && exception instanceof Error ? exception.message : 'Something went wrong',
        correlationId,
      },
    });
  }
}

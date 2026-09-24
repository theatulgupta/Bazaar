import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from '../context/request-context';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-correlation-id');
  const correlationId = incoming && incoming.length <= 80 ? incoming : randomUUID();
  res.setHeader('x-correlation-id', correlationId);
  requestContext.run({ correlationId }, () => next());
}

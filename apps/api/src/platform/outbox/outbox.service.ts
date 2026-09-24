import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { currentCorrelationId } from '../context/request-context';
import type { Tx } from '../database/unit-of-work';
import type { OutboxPayloads, OutboxType } from './outbox.types';

@Injectable()
export class OutboxService {
  async append<T extends OutboxType>(tx: Tx, type: T, payload: OutboxPayloads[T]): Promise<void> {
    await tx.outboxMessage.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        correlationId: currentCorrelationId(),
      },
    });
  }
}

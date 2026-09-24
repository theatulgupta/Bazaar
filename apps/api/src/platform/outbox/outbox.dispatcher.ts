import { Injectable, Logger } from '@nestjs/common';
import { requestContext } from '../context/request-context';
import { PrismaService } from '../database/prisma.service';
import { outboxProcessed } from '../telemetry/metrics';
import { withSpan } from '../telemetry/telemetry';
import { OutboxHandler } from './outbox.handler';

type Row = {
  id: string;
  type: string;
  payload: unknown;
  correlation_id: string;
};

@Injectable()
export class OutboxDispatcher {
  private readonly logger = new Logger(OutboxDispatcher.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly handler: OutboxHandler,
  ) {}

  async drainOnce(): Promise<number> {
    const messages = await this.prisma.$queryRaw<Row[]>`
      WITH next AS (
        SELECT id FROM platform.outbox
        WHERE published_at IS NULL AND attempts < 10
        ORDER BY occurred_at
        FOR UPDATE SKIP LOCKED
        LIMIT 20
      )
      UPDATE platform.outbox AS o
      SET attempts = o.attempts + 1
      FROM next
      WHERE o.id = next.id
      RETURNING o.id, o.type, o.payload, o.correlation_id
    `;

    for (const message of messages) {
      await requestContext.run({ correlationId: message.correlation_id }, async () => {
        try {
          await withSpan('outbox.handle', { 'messaging.operation': message.type, correlationId: message.correlation_id }, () =>
            this.handler.handle({
              id: message.id,
              type: message.type,
              payload: message.payload,
              correlationId: message.correlation_id,
            }),
          );
          await this.prisma.outboxMessage.update({
            where: { id: message.id },
            data: { publishedAt: new Date() },
          });
          outboxProcessed.inc({ type: message.type, result: 'ok' });
        } catch (error) {
          outboxProcessed.inc({ type: message.type, result: 'error' });
          this.logger.error(`outbox ${message.type} failed: ${error instanceof Error ? error.message : 'error'}`);
        }
      });
    }
    return messages.length;
  }
}

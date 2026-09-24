import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { conflict } from '../../shared/domain-error';
import type { Tx } from '../database/unit-of-work';
import { PrismaService } from '../database/prisma.service';

export type IdempotencyRecord = {
  status: string;
  requestHash: string;
  response: unknown;
};

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  hash(body: unknown): string {
    return createHash('sha256').update(JSON.stringify(body)).digest('hex');
  }

  async find(userId: string, key: string): Promise<IdempotencyRecord | null> {
    const row = await this.prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId, key } },
    });
    if (!row) return null;
    return { status: row.status, requestHash: row.requestHash, response: row.response };
  }

  async begin(tx: Tx, input: { userId: string; key: string; requestHash: string }): Promise<'created' | 'exists'> {
    try {
      await tx.idempotencyKey.create({
        data: {
          userId: input.userId,
          key: input.key,
          requestHash: input.requestHash,
          status: 'in_progress',
        },
      });
      return 'created';
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return 'exists';
      throw error;
    }
  }

  async complete(userId: string, key: string, response: unknown): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { userId_key: { userId, key } },
      data: { status: 'completed', response: response as Prisma.InputJsonValue },
    });
  }

  async fail(userId: string, key: string, response: unknown): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { userId_key: { userId, key } },
      data: { status: 'failed', response: response as Prisma.InputJsonValue },
    });
  }

  assertSameRequest(record: IdempotencyRecord, requestHash: string): void {
    if (record.requestHash !== requestHash) {
      throw conflict('This Idempotency-Key was already used with a different request');
    }
  }
}

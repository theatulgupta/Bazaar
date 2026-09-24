import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { accessTtlSeconds, loadEnv } from './config/env';
import { AuditService } from './audit/audit.service';
import { PrismaService } from './database/prisma.service';
import { UnitOfWork } from './database/unit-of-work';
import { HealthController } from './health/health.controller';
import { IdempotencyService } from './idempotency/idempotency.service';
import { OutboxService } from './outbox/outbox.service';
import { currentCorrelationId } from './context/request-context';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({ correlationId: currentCorrelationId() }),
        transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
        autoLogging: process.env.NODE_ENV !== 'test',
      },
    }),
    JwtModule.registerAsync({
      useFactory: () => {
        const env = loadEnv();
        return {
          secret: env.JWT_SECRET,
          signOptions: { expiresIn: accessTtlSeconds(env.JWT_ACCESS_TTL) },
        };
      },
    }),
  ],
  controllers: [HealthController],
  providers: [PrismaService, UnitOfWork, OutboxService, IdempotencyService, AuditService],
  exports: [JwtModule, PrismaService, UnitOfWork, OutboxService, IdempotencyService, AuditService, LoggerModule],
})
export class PlatformModule {}

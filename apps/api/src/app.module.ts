import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CompositionModule } from './composition/composition.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { IdentityModule } from './modules/identity/identity.module';
import { AuthGuard } from './platform/auth/auth.guard';
import { loadEnv } from './platform/config/env';
import { MetricsInterceptor } from './platform/http/metrics.interceptor';
import { PlatformModule } from './platform/platform.module';

const env = loadEnv();

@Module({
  imports: [
    PlatformModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
      skipIf: () => env.RATE_LIMIT_DISABLED,
    }),
    IdentityModule,
    CheckoutModule,
    CompositionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}

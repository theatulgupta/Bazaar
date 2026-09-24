import { Module } from '@nestjs/common';
import { CompositionModule } from './composition/composition.module';
import { IdentityModule } from './modules/identity/identity.module';
import { PlatformModule } from './platform/platform.module';

@Module({
  imports: [PlatformModule, IdentityModule, CompositionModule],
})
export class WorkerModule {}

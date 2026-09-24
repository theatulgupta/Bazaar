import { Module } from '@nestjs/common';
import { CatalogService } from './application/catalog.service';
import { CatalogReader, CatalogWriter } from './application/catalog.ports';
import { PrismaCatalog } from './infrastructure/catalog.prisma';

@Module({
  providers: [
    PrismaCatalog,
    { provide: CatalogReader, useExisting: PrismaCatalog },
    { provide: CatalogWriter, useExisting: PrismaCatalog },
    CatalogService,
  ],
  exports: [CatalogReader, CatalogWriter, CatalogService],
})
export class CatalogModule {}

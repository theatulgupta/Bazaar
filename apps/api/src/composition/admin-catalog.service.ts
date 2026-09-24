import { Injectable } from '@nestjs/common';
import type { CreateProductInput } from '@bazaar/contracts';
import { CatalogService } from '../modules/catalog/application/catalog.service';
import { CatalogReader } from '../modules/catalog/application/catalog.ports';
import { InventoryService } from '../modules/inventory/application/inventory.service';
import { InventoryReader } from '../modules/inventory/application/inventory.ports';

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly catalog: CatalogService,
    private readonly catalogReader: CatalogReader,
    private readonly inventory: InventoryService,
    private readonly stocks: InventoryReader,
  ) {}

  list() {
    return this.catalogReader.search({ page: 1, pageSize: 48, includeInactive: true });
  }

  async create(actorId: string, input: CreateProductInput) {
    const product = await this.catalog.create(actorId, input);
    await this.inventory.openStock(product.id, input.stock);
    return { ...product, available: input.stock };
  }

  update(actorId: string, id: string, input: Parameters<CatalogService['update']>[2]) {
    return this.catalog.update(actorId, id, input);
  }

  stock(productId: string) {
    return this.stocks.get(productId);
  }

  adjust(actorId: string, productId: string, onHand: number) {
    return this.inventory.adjust(actorId, productId, onHand);
  }
}

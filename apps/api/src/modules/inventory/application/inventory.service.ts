import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../platform/audit/audit.service';
import { InventoryWriter, type StockView } from './inventory.ports';

@Injectable()
export class InventoryService {
  constructor(
    private readonly writer: InventoryWriter,
    private readonly audit: AuditService,
  ) {}

  async openStock(productId: string, onHand: number): Promise<void> {
    await this.writer.ensure(productId, onHand);
    await this.writer.setOnHand(productId, onHand);
  }

  async adjust(actorId: string, productId: string, onHand: number): Promise<StockView> {
    const stock = await this.writer.setOnHand(productId, onHand);
    await this.audit.record({
      actorId,
      action: 'inventory.adjusted',
      entityType: 'stock',
      entityId: productId,
      metadata: { onHand },
    });
    return stock;
  }
}

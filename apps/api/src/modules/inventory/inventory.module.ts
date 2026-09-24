import { Module } from '@nestjs/common';
import { InventoryService } from './application/inventory.service';
import { InventoryReader, InventoryWriter } from './application/inventory.ports';
import { PrismaInventory } from './infrastructure/inventory.prisma';

@Module({
  providers: [
    PrismaInventory,
    { provide: InventoryReader, useExisting: PrismaInventory },
    { provide: InventoryWriter, useExisting: PrismaInventory },
    InventoryService,
  ],
  exports: [InventoryReader, InventoryWriter, InventoryService],
})
export class InventoryModule {}

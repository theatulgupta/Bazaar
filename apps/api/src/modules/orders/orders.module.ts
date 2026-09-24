import { Module } from '@nestjs/common';
import { OrderStore } from './application/order.ports';
import { PrismaOrders } from './infrastructure/order.prisma';

@Module({
  providers: [PrismaOrders, { provide: OrderStore, useExisting: PrismaOrders }],
  exports: [OrderStore],
})
export class OrdersModule {}

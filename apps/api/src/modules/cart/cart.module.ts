import { Module } from '@nestjs/common';
import { CartStore } from './application/cart.ports';
import { PrismaCart } from './infrastructure/cart.prisma';

@Module({
  providers: [PrismaCart, { provide: CartStore, useExisting: PrismaCart }],
  exports: [CartStore],
})
export class CartModule {}

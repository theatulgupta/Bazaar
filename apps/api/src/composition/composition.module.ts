import { Module } from '@nestjs/common';
import { AdminController } from '../interface/admin.controller';
import { CartController, CatalogController, OrdersController, WishlistController } from '../interface/public.controller';
import { OutboxDispatcher } from '../platform/outbox/outbox.dispatcher';
import { OutboxHandler } from '../platform/outbox/outbox.handler';
import { CartModule } from '../modules/cart/cart.module';
import { CatalogModule } from '../modules/catalog/catalog.module';
import { CheckoutModule } from '../modules/checkout/checkout.module';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { OrdersModule } from '../modules/orders/orders.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { AdminCatalogService } from './admin-catalog.service';
import { FulfillmentService } from './fulfillment.service';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [CatalogModule, InventoryModule, CartModule, CheckoutModule, OrdersModule, PaymentsModule, NotificationsModule],
  controllers: [CatalogController, CartController, WishlistController, OrdersController, AdminController],
  providers: [
    FulfillmentService,
    { provide: OutboxHandler, useExisting: FulfillmentService },
    OutboxDispatcher,
    StorefrontService,
    AdminCatalogService,
  ],
  exports: [FulfillmentService, OutboxHandler, OutboxDispatcher, StorefrontService, AdminCatalogService],
})
export class CompositionModule {}

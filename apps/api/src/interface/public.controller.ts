import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { cartItemInputSchema, mergeCartSchema, placeOrderSchema } from '@bazaar/contracts';
import { CurrentUser, Public, type AuthUser } from '../platform/auth/current-user';
import { parseBody } from '../platform/http/parse';
import { CheckoutService } from '../modules/checkout/application/checkout.service';
import { FulfillmentService } from '../composition/fulfillment.service';
import { StorefrontService } from '../composition/storefront.service';
import { OrderStore } from '../modules/orders/application/order.ports';
import { notFound } from '../shared/domain-error';

@ApiTags('catalog')
@Throttle({ default: { limit: 3000, ttl: 60_000 } })
@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private readonly storefront: StorefrontService) {}

  @Public()
  @Get('categories')
  async categories() {
    return { data: await this.storefront.categories() };
  }

  @Public()
  @Get('products')
  async products(@Query('q') q?: string, @Query('category') category?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return { data: await this.storefront.products({ q, category, ...paging(page, pageSize) }) };
  }

  @Public()
  @Get('deals')
  async deals() {
    return { data: await this.storefront.deals(8) };
  }

  @Public()
  @Get('products/:slug')
  async product(@Param('slug') slug: string) {
    return { data: await this.storefront.product(slug) };
  }
}

@ApiTags('cart')
@Controller('api/v1/cart')
export class CartController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get()
  async get(@CurrentUser() user: AuthUser) {
    return { data: await this.storefront.cart(user.id) };
  }

  @Post('items')
  async add(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parseBody(cartItemInputSchema, body);
    return { data: await this.storefront.addToCart(user.id, input.productId, input.quantity) };
  }

  @Put('items/:productId')
  async set(@CurrentUser() user: AuthUser, @Param('productId') productId: string, @Body() body: unknown) {
    const input = parseBody(cartItemInputSchema.pick({ quantity: true }), body);
    return { data: await this.storefront.setQuantity(user.id, productId, input.quantity) };
  }

  @Delete('items/:productId')
  async remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return { data: await this.storefront.removeFromCart(user.id, productId) };
  }

  @Post('merge')
  async merge(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parseBody(mergeCartSchema, body);
    return { data: await this.storefront.mergeCart(user.id, input.items) };
  }
}

@ApiTags('wishlist')
@Controller('api/v1/wishlist')
export class WishlistController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return { data: await this.storefront.wishlist(user.id) };
  }

  @Post()
  async add(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parseBody(cartItemInputSchema.pick({ productId: true }), body);
    return { data: await this.storefront.saveWishlist(user.id, input.productId) };
  }

  @Delete(':productId')
  async remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return { data: await this.storefront.removeWishlist(user.id, productId) };
  }
}

@ApiTags('checkout')
@Controller('api/v1/checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get('quote')
  async quote(@CurrentUser() user: AuthUser) {
    return { data: await this.checkout.quote(user.id) };
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(201)
  @Post('orders')
  async place(@CurrentUser() user: AuthUser, @Body() body: unknown, @Headers('idempotency-key') key?: string) {
    const input = parseBody(placeOrderSchema, body);
    return { data: await this.checkout.place(user, input.addressId, key) };
  }
}

@ApiTags('orders')
@Controller('api/v1/orders')
export class OrdersController {
  constructor(
    private readonly orders: OrderStore,
    private readonly fulfillment: FulfillmentService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return { data: await this.orders.listForUser(user.id) };
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const order = await this.orders.getForUser(user.id, id);
    if (!order) throw notFound('Order not found');
    return { data: order };
  }

  @HttpCode(200)
  @Post(':id/cancel')
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.fulfillment.cancel(user, id) };
  }
}

function paging(page?: string, pageSize?: string) {
  return {
    page: Math.max(1, Number(page) || 1),
    pageSize: Math.min(48, Math.max(1, Number(pageSize) || 20)),
  };
}

import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createProductSchema, orderStatusSchema, setStockSchema, transitionSchema, updateProductSchema } from '@bazaar/contracts';
import { AdminCatalogService } from '../composition/admin-catalog.service';
import { FulfillmentService } from '../composition/fulfillment.service';
import { AuditService } from '../platform/audit/audit.service';
import { CurrentUser, RequirePermissions, type AuthUser } from '../platform/auth/current-user';
import { parseBody } from '../platform/http/parse';
import { OrderStore } from '../modules/orders/application/order.ports';
import { PaymentStore } from '../modules/payments/application/payment.ports';
import { notFound } from '../shared/domain-error';

@ApiTags('admin')
@Controller('admin/v1')
export class AdminController {
  constructor(
    private readonly catalog: AdminCatalogService,
    private readonly orders: OrderStore,
    private readonly payments: PaymentStore,
    private readonly fulfillment: FulfillmentService,
    private readonly audit: AuditService,
  ) {}

  @RequirePermissions('catalog:write')
  @Get('products')
  async products() {
    return { data: await this.catalog.list() };
  }

  @RequirePermissions('catalog:write')
  @Post('products')
  async createProduct(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parseBody(createProductSchema, body);
    return { data: await this.catalog.create(user.id, { ...input, active: input.active ?? true }) };
  }

  @RequirePermissions('catalog:write')
  @Patch('products/:id')
  async updateProduct(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return { data: await this.catalog.update(user.id, id, parseBody(updateProductSchema, body)) };
  }

  @RequirePermissions('inventory:read')
  @Get('inventory/:productId')
  async stock(@Param('productId') productId: string) {
    const stock = await this.catalog.stock(productId);
    if (!stock) throw notFound('Stock record not found');
    return { data: stock };
  }

  @RequirePermissions('catalog:write')
  @Put('inventory/:productId')
  async adjust(@CurrentUser() user: AuthUser, @Param('productId') productId: string, @Body() body: unknown) {
    const input = parseBody(setStockSchema, body);
    return { data: await this.catalog.adjust(user.id, productId, input.onHand) };
  }

  @RequirePermissions('orders:read')
  @Get('orders')
  async ordersList(@Query('status') status?: string) {
    const parsed = status ? orderStatusSchema.parse(status) : undefined;
    return { data: await this.orders.listAll(parsed) };
  }

  @RequirePermissions('orders:fulfill')
  @HttpCode(200)
  @Post('orders/:id/transition')
  async transition(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const input = parseBody(transitionSchema, body);
    return { data: await this.fulfillment.fulfill(user.id, id, input.status) };
  }

  @RequirePermissions('payments:read')
  @Get('orders/:id/payment')
  async payment(@Param('id') id: string) {
    const payment = await this.payments.findByOrder(id);
    if (!payment) throw notFound('Payment not found');
    return { data: payment };
  }

  @RequirePermissions('audit:read')
  @Get('audit')
  async auditLog(@Query('limit') limit?: string) {
    return { data: await this.audit.list(Number(limit) || 50) };
  }
}

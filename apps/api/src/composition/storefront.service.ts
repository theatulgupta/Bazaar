import { Injectable } from '@nestjs/common';
import type { CartLine, Product } from '@bazaar/contracts';
import { notFound } from '../shared/domain-error';
import { CartStore } from '../modules/cart/application/cart.ports';
import { CatalogReader, type ProductQuery } from '../modules/catalog/application/catalog.ports';
import { CheckoutService } from '../modules/checkout/application/checkout.service';
import { InventoryReader } from '../modules/inventory/application/inventory.ports';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly catalog: CatalogReader,
    private readonly inventory: InventoryReader,
    private readonly carts: CartStore,
    private readonly checkout: CheckoutService,
  ) {}

  categories() {
    return this.catalog.listCategories();
  }

  async products(query: ProductQuery) {
    const page = await this.catalog.search(query);
    return { ...page, items: await this.withStock(page.items) };
  }

  async deals(limit: number) {
    const page = await this.catalog.search({ page: 1, pageSize: limit, dealsOnly: true });
    return this.withStock(page.items);
  }

  async product(slug: string): Promise<Product> {
    const product = await this.catalog.getBySlug(slug);
    if (!product || !product.active) throw notFound('Product not found');
    const [withStock] = await this.withStock([product]);
    return withStock;
  }

  async cart(userId: string): Promise<{ items: CartLine[] }> {
    const quote = await this.checkout.quote(userId);
    return {
      items: quote.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        title: line.title,
        slug: line.slug,
        imageUrl: line.imageUrl,
        unitPricePaise: line.unitPricePaise,
        available: line.available,
      })),
    };
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    const product = await this.catalog.getById(productId);
    if (!product?.active) throw notFound('Product not found');
    await this.carts.add(userId, productId, quantity);
    return this.cart(userId);
  }

  async setQuantity(userId: string, productId: string, quantity: number) {
    await this.carts.setQuantity(userId, productId, quantity);
    return this.cart(userId);
  }

  async removeFromCart(userId: string, productId: string) {
    await this.carts.remove(userId, productId);
    return this.cart(userId);
  }

  async mergeCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
    const known = await this.catalog.findByIds(items.map((item) => item.productId));
    const active = new Set(known.filter((product) => product.active).map((product) => product.id));
    await this.carts.merge(
      userId,
      items.filter((item) => active.has(item.productId)),
    );
    return this.cart(userId);
  }

  async wishlist(userId: string): Promise<Product[]> {
    const ids = await this.carts.wishlist(userId);
    const products = await this.catalog.findByIds(ids);
    return this.withStock(products.filter((product) => product.active));
  }

  async saveWishlist(userId: string, productId: string) {
    const product = await this.catalog.getById(productId);
    if (!product?.active) throw notFound('Product not found');
    await this.carts.saveWishlist(userId, productId);
    return this.wishlist(userId);
  }

  async removeWishlist(userId: string, productId: string) {
    await this.carts.removeWishlist(userId, productId);
    return this.wishlist(userId);
  }

  private async withStock(products: Array<Omit<Product, 'available'>>): Promise<Product[]> {
    const stock = await this.inventory.availableFor(products.map((product) => product.id));
    return products.map((product) => ({ ...product, available: stock.get(product.id) ?? 0 }));
  }
}

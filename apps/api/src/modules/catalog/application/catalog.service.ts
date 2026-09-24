import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../platform/audit/audit.service';
import { conflict, invariant, notFound } from '../../../shared/domain-error';
import { slugify } from '../domain/slug';
import { CatalogReader, CatalogWriter, type CatalogProduct, type CreateProduct, type UpdateProduct } from './catalog.ports';

@Injectable()
export class CatalogService {
  constructor(
    private readonly reader: CatalogReader,
    private readonly writer: CatalogWriter,
    private readonly audit: AuditService,
  ) {}

  async create(actorId: string, input: CreateProduct): Promise<CatalogProduct> {
    if (input.mrpPaise < input.pricePaise) throw invariant('MRP must be greater than or equal to the selling price');
    const category = await this.reader.findCategory(input.categorySlug);
    if (!category) throw notFound('Category not found');
    const slug = `${slugify(input.title)}-${randomBytes(3).toString('hex')}`;
    const product = await this.writer.create({ ...input, slug, categoryId: category.id });
    await this.audit.record({
      actorId,
      action: 'catalog.product_created',
      entityType: 'product',
      entityId: product.id,
      metadata: { pricePaise: product.pricePaise },
    });
    return product;
  }

  async update(actorId: string, id: string, input: UpdateProduct): Promise<CatalogProduct> {
    if (input.pricePaise != null && input.mrpPaise != null && input.mrpPaise < input.pricePaise) {
      throw invariant('MRP must be greater than or equal to the selling price');
    }
    const current = await this.reader.getById(id);
    if (!current) throw notFound('Product not found');
    const nextMrp = input.mrpPaise ?? current.mrpPaise;
    const nextPrice = input.pricePaise ?? current.pricePaise;
    if (nextMrp < nextPrice) throw invariant('MRP must be greater than or equal to the selling price');
    const slug = input.title ? `${slugify(input.title)}-${randomBytes(3).toString('hex')}` : undefined;
    const product = await this.writer.update(id, { ...input, slug });
    if (!product) throw conflict('Product could not be updated');
    await this.audit.record({
      actorId,
      action: 'catalog.product_updated',
      entityType: 'product',
      entityId: product.id,
      metadata: { pricePaise: product.pricePaise, active: product.active },
    });
    return product;
  }
}

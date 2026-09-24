import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service';
import {
  CatalogReader,
  CatalogWriter,
  type CatalogProduct,
  type CategoryView,
  type CreateProduct,
  type ProductPage,
  type ProductQuery,
  type UpdateProduct,
} from '../application/catalog.ports';

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price_paise: number;
  mrp_paise: number;
  image_url: string;
  active: boolean;
  category_slug: string;
  category_name: string;
};

@Injectable()
export class PrismaCatalog extends CatalogReader implements CatalogWriter {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listCategories(): Promise<CategoryView[]> {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findCategory(slug: string): Promise<CategoryView | null> {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  async search(query: ProductQuery): Promise<ProductPage> {
    const where: Prisma.Sql[] = [];
    if (!query.dealsOnly && !query.includeInactive) where.push(Prisma.sql`p.active = true`);
    if (query.category) where.push(Prisma.sql`c.slug = ${query.category}`);
    if (query.dealsOnly) where.push(Prisma.sql`p.active = true AND p.mrp_paise > p.price_paise`);
    if (query.q) {
      where.push(
        Prisma.sql`to_tsvector('english', p.title || ' ' || p.description) @@ plainto_tsquery('english', ${query.q})`,
      );
    }
    const filter = where.length ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.empty;
    const offset = (query.page - 1) * query.pageSize;
    const rank = query.q
      ? Prisma.sql`ts_rank(to_tsvector('english', p.title || ' ' || p.description), plainto_tsquery('english', ${query.q})) DESC`
      : Prisma.sql`p.created_at DESC`;

    const items = await this.prisma.$queryRaw<ProductRow[]>`
      SELECT p.id, p.title, p.slug, p.description, p.price_paise, p.mrp_paise, p.image_url, p.active,
             c.slug AS category_slug, c.name AS category_name
      FROM catalog.products p
      JOIN catalog.categories c ON c.id = p.category_id
      ${filter}
      ORDER BY ${rank}
      LIMIT ${query.pageSize} OFFSET ${offset}
    `;
    const totalRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM catalog.products p
      JOIN catalog.categories c ON c.id = p.category_id
      ${filter}
    `;
    return {
      items: items.map(mapRow),
      page: query.page,
      pageSize: query.pageSize,
      total: Number(totalRows[0]?.count ?? 0),
    };
  }

  async getBySlug(slug: string): Promise<CatalogProduct | null> {
    const rows = await this.prisma.$queryRaw<ProductRow[]>`
      SELECT p.id, p.title, p.slug, p.description, p.price_paise, p.mrp_paise, p.image_url, p.active,
             c.slug AS category_slug, c.name AS category_name
      FROM catalog.products p
      JOIN catalog.categories c ON c.id = p.category_id
      WHERE p.slug = ${slug}
      LIMIT 1
    `;
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async getById(id: string): Promise<CatalogProduct | null> {
    const found = await this.findByIds([id]);
    return found[0] ?? null;
  }

  async findByIds(ids: string[]): Promise<CatalogProduct[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.$queryRaw<ProductRow[]>`
      SELECT p.id, p.title, p.slug, p.description, p.price_paise, p.mrp_paise, p.image_url, p.active,
             c.slug AS category_slug, c.name AS category_name
      FROM catalog.products p
      JOIN catalog.categories c ON c.id = p.category_id
      WHERE p.id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
    `;
    return rows.map(mapRow);
  }

  async create(input: CreateProduct & { slug: string; categoryId: string }): Promise<CatalogProduct> {
    const row = await this.prisma.product.create({
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        categoryId: input.categoryId,
        pricePaise: input.pricePaise,
        mrpPaise: input.mrpPaise,
        imageUrl: input.imageUrl,
        active: input.active,
      },
      include: { category: true },
    });
    return mapProduct(row);
  }

  async update(id: string, input: UpdateProduct & { slug?: string }): Promise<CatalogProduct | null> {
    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: input,
        include: { category: true },
      });
      return mapProduct(row);
    } catch {
      return null;
    }
  }
}

function mapRow(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    pricePaise: row.price_paise,
    mrpPaise: row.mrp_paise,
    imageUrl: row.image_url,
    active: row.active,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
  };
}

function mapProduct(row: {
  id: string;
  title: string;
  slug: string;
  description: string;
  pricePaise: number;
  mrpPaise: number;
  imageUrl: string;
  active: boolean;
  category: { slug: string; name: string };
}): CatalogProduct {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    pricePaise: row.pricePaise,
    mrpPaise: row.mrpPaise,
    imageUrl: row.imageUrl,
    active: row.active,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
  };
}

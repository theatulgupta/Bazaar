export type CatalogProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  pricePaise: number;
  mrpPaise: number;
  imageUrl: string;
  active: boolean;
};

export type CategoryView = { id: string; name: string; slug: string };

export type ProductQuery = {
  q?: string;
  category?: string;
  page: number;
  pageSize: number;
  dealsOnly?: boolean;
  includeInactive?: boolean;
};

export type ProductPage = {
  items: CatalogProduct[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateProduct = {
  title: string;
  description: string;
  categorySlug: string;
  pricePaise: number;
  mrpPaise: number;
  imageUrl: string;
  active: boolean;
};

export type UpdateProduct = Partial<Omit<CreateProduct, 'categorySlug'>>;

export abstract class CatalogReader {
  abstract listCategories(): Promise<CategoryView[]>;
  abstract findCategory(slug: string): Promise<CategoryView | null>;
  abstract search(query: ProductQuery): Promise<ProductPage>;
  abstract getBySlug(slug: string): Promise<CatalogProduct | null>;
  abstract getById(id: string): Promise<CatalogProduct | null>;
  abstract findByIds(ids: string[]): Promise<CatalogProduct[]>;
}

export abstract class CatalogWriter {
  abstract create(input: CreateProduct & { slug: string; categoryId: string }): Promise<CatalogProduct>;
  abstract update(id: string, input: UpdateProduct & { slug?: string }): Promise<CatalogProduct | null>;
}

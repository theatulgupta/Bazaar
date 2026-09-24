import type { Product } from '@bazaar/contracts';
import { ProductCard } from '@/components/product-card';
import { SearchBox } from '@/components/search-box';
import { publicApi } from '@/lib/api';

type ProductPage = { items: Product[]; total: number };

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const page = query.length > 1 ? await publicApi<ProductPage>(`/api/v1/catalog/products?q=${encodeURIComponent(query)}`) : null;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Search</h1>
      <SearchBox initial={query} />
      {page ? <p className="mt-4 text-sm text-muted">{page.total} results</p> : <p className="mt-4 text-muted">Type at least two characters.</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {page?.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

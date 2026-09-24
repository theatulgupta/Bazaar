import type { Category, Product } from '@bazaar/contracts';
import { ProductCard } from '@/components/product-card';
import { publicApi } from '@/lib/api';
import Link from 'next/link';

type ProductPage = { items: Product[]; total: number; page: number; pageSize: number };

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const pageNumber = Math.max(1, Number(pageParam) || 1);
  const page = await publicApi<ProductPage>(
    `/api/v1/catalog/products?category=${encodeURIComponent(slug)}&page=${pageNumber}&pageSize=24`,
  );
  const pages = Math.max(1, Math.ceil(page.total / page.pageSize));
  return (
    <div>
      <h1 className="mb-2 font-display text-4xl capitalize">{slug.replaceAll('-', ' ')}</h1>
      <p className="mb-4 text-sm text-muted">
        {page.total} products · page {page.page} of {pages}
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {page.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        {pageNumber > 1 ? (
          <Link href={`/c/${slug}?page=${pageNumber - 1}`} className="rounded-full bg-sand px-4 py-2">
            Previous
          </Link>
        ) : null}
        {pageNumber < pages ? (
          <Link href={`/c/${slug}?page=${pageNumber + 1}`} className="rounded-full bg-primary px-4 py-2 text-onPrimary">
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}

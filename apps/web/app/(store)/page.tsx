import type { Category, Product } from '@bazaar/contracts';
import { Gem, Laptop, Shirt, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { publicApi } from '@/lib/api';

type ProductPage = { items: Product[] };

export const dynamic = 'force-dynamic';

const icons: Record<string, typeof Shirt> = {
  electronics: Laptop,
  phones: Laptop,
  audio: Sparkles,
  cameras: Sparkles,
  jewelery: Gem,
  beauty: Sparkles,
  'mens-clothing': Shirt,
  'womens-clothing': Shirt,
  footwear: Shirt,
  kids: Shirt,
  home: Sparkles,
  kitchen: Sparkles,
  sports: Sparkles,
  books: Sparkles,
  groceries: Sparkles,
  bags: Sparkles,
};

export default async function HomePage() {
  try {
    const [categories, deals, products] = await Promise.all([
      publicApi<Category[]>('/api/v1/catalog/categories'),
      publicApi<Product[]>('/api/v1/catalog/deals'),
      publicApi<ProductPage>('/api/v1/catalog/products?pageSize=8'),
    ]);
    return (
      <div>
        <section className="overflow-hidden rounded-lg bg-primary px-8 py-12 text-onPrimary">
          <p className="text-sm uppercase tracking-wide">This week</p>
          <h1 className="mt-2 font-display text-5xl">Fresh finds</h1>
          <p className="mt-3 max-w-md text-onPrimary/90">Deals from the stall, priced in rupees, never by the browser.</p>
          <Link href="/search" className="mt-6 inline-block rounded-full bg-accent px-5 py-3 font-semibold text-ink">
            Browse the stall
          </Link>
        </section>
        <h2 className="mt-10 font-display text-3xl">Browse</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {categories.map((category) => {
            const Icon = icons[category.slug] ?? Sparkles;
            return (
              <Link key={category.id} href={`/c/${category.slug}`} className="flex w-28 flex-col items-center gap-2">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand">
                  <Icon size={22} />
                </span>
                <span className="text-center text-sm">{category.name}</span>
              </Link>
            );
          })}
        </div>
        <h2 className="mt-10 font-display text-3xl">On the stall</h2>
        <p className="text-sm text-muted">Marked down from the listed price</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <h2 className="mt-10 font-display text-3xl">New arrivals</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {products.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  } catch {
    return <p>The stall is closed. Start the API and refresh.</p>;
  }
}

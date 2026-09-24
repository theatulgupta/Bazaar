import type { Metadata } from 'next';
import type { Product } from '@bazaar/contracts';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/add-to-cart';
import { ApiError, publicApi } from '@/lib/api';
import { rupees } from '@/lib/money';

export const dynamic = 'force-dynamic';

async function load(slug: string): Promise<Product | null> {
  try {
    return await publicApi<Product>(`/api/v1/catalog/products/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await load(slug);
  return { title: product?.title ?? 'Product' };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await load(slug);
  if (!product) notFound();
  return (
    <article className="grid items-start gap-8 md:grid-cols-2">
      <img src={product.imageUrl} alt="" className="h-96 w-full rounded-lg bg-sand object-contain p-6" />
      <div className="md:sticky md:top-24">
        <p className="text-sm text-muted">{product.categoryName}</p>
        <h1 className="mt-1 font-display text-4xl">{product.title}</h1>
        <p className="mt-3 text-2xl font-semibold">{rupees(product.pricePaise)}</p>
        {product.mrpPaise > product.pricePaise ? <p className="text-muted line-through">{rupees(product.mrpPaise)}</p> : null}
        <p className="mt-4 leading-7">{product.description}</p>
        <AddToCart product={product} />
      </div>
    </article>
  );
}

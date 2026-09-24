import type { Product } from '@bazaar/contracts';
import Link from 'next/link';
import { rupees } from '@/lib/money';

export function discountPercent(pricePaise: number, mrpPaise: number) {
  if (mrpPaise <= pricePaise) return 0;
  return Math.round((1 - pricePaise / mrpPaise) * 100);
}

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.pricePaise, product.mrpPaise);
  return (
    <Link href={`/product/${product.slug}`} className="flex flex-col rounded-lg bg-surface p-3">
      <div className="relative flex h-40 items-center justify-center rounded-lg bg-sand">
        <img src={product.imageUrl} alt="" className="h-36 w-full object-contain" />
        {off > 0 ? <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold">{off}% off</span> : null}
      </div>
      <p className="mt-3 line-clamp-2 text-sm">{product.title}</p>
      <p className="mt-1 text-lg font-semibold">{rupees(product.pricePaise)}</p>
      {product.mrpPaise > product.pricePaise ? <p className="text-sm text-muted line-through">{rupees(product.mrpPaise)}</p> : null}
    </Link>
  );
}

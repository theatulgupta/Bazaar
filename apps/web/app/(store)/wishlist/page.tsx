'use client';

import Link from 'next/link';
import { rupees } from '@/lib/money';
import { useMe, useWishlistQuery } from '@/lib/queries';

export default function WishlistPage() {
  const me = useMe();
  const wishlist = useWishlistQuery(Boolean(me.data));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      {me.isError ? <p className="mt-4 text-muted">Sign in to see your wishlist.</p> : null}
      <div className="mt-4 space-y-3">
        {wishlist.data?.length === 0 ? <p className="text-muted">Nothing saved yet.</p> : null}
        {wishlist.data?.map((item) => (
          <Link key={item.id} href={`/product/${item.slug}`} className="flex items-center gap-4 rounded-lg bg-white p-3">
            <img src={item.imageUrl} alt="" className="h-16 w-16 object-contain" />
            <span className="flex-1">{item.title}</span>
            <span className="font-semibold">{rupees(item.pricePaise)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

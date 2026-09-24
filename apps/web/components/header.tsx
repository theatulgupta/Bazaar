'use client';

import { Heart, Search, ShoppingBag, UserRound } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGuestItems } from '@/lib/guest-cart';
import { useCartQuery, useMe } from '@/lib/queries';

export function Header() {
  const router = useRouter();
  const guestItems = useGuestItems();
  const me = useMe();
  const cart = useCartQuery(Boolean(me.data));
  const [q, setQ] = useState('');
  const guestCount = guestItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const count = me.data ? cartCount : guestCount;

  function search(event: FormEvent) {
    event.preventDefault();
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-display text-3xl text-ink">
          Bazaar
        </Link>
        <form onSubmit={search} className="flex flex-1 items-center rounded-full border border-line bg-sand px-4">
          <Search size={18} className="text-muted" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Look through the stall"
            className="w-full bg-transparent px-3 py-2.5 outline-none"
          />
        </form>
        <Link href="/wishlist" aria-label="Wishlist" className="rounded-full bg-sand p-2">
          <Heart size={18} />
        </Link>
        <Link href={me.data ? '/account' : '/login'} aria-label="Account" className="rounded-full bg-sand p-2">
          <UserRound size={18} />
        </Link>
        <Link href="/cart" aria-label="Bag" className="relative rounded-full bg-sand p-2">
          <ShoppingBag size={18} />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-onPrimary">
              {count}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted">
        <p className="font-display text-xl text-ink">Bazaar</p>
        <p>A warm marketplace. Prices are set on the server, in rupees.</p>
      </div>
    </footer>
  );
}

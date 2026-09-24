'use client';

import { useDebouncedValue } from '@tanstack/react-pacer/debouncer';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [debounced] = useDebouncedValue(q, { wait: 300 });

  useEffect(() => {
    const next = debounced.trim();
    if (next === initial) return;
    router.replace(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
  }, [debounced, initial, router]);

  return (
    <input
      value={q}
      onChange={(event) => setQ(event.target.value)}
      placeholder="Search products"
      className="mt-4 w-full rounded-lg border border-line bg-white px-3 py-3"
    />
  );
}

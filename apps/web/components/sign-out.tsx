'use client';

import { useRouter } from 'next/navigation';
import { browserApi } from '@/lib/api';

export function SignOut() {
  const router = useRouter();
  return (
    <button
      className="mt-6 rounded-lg bg-ink px-4 py-2 text-white"
      onClick={() => {
        browserApi('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({}) })
          .catch(() => undefined)
          .finally(() => router.push('/'));
      }}
    >
      Sign out
    </button>
  );
}

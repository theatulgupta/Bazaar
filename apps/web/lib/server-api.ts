import { cookies } from 'next/headers';
import { ApiError } from '@/lib/api';

const origin = process.env.API_URL ?? 'http://localhost:8000';

type Envelope<T> = { data?: T; error?: { message?: string } };

export async function serverApi<T>(path: string): Promise<T> {
  const jar = await cookies();
  const response = await fetch(`${origin}${path}`, {
    headers: { cookie: jar.toString() },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok) throw new ApiError(body?.error?.message ?? 'Request failed', response.status);
  return body?.data as T;
}

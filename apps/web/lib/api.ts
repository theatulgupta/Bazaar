const origin = process.env.API_URL ?? 'http://localhost:8000';

type Envelope<T> = { data?: T; error?: { message?: string } };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
  return read<T>(response);
}

export async function browserApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(path, { ...init, headers, credentials: 'include' });
  return read<T>(response);
}

async function read<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok) throw new ApiError(body?.error?.message ?? 'Request failed', response.status);
  return body?.data as T;
}

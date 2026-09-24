import { NextRequest, NextResponse } from 'next/server';

const forwarded = ['cookie', 'content-type', 'authorization', 'idempotency-key', 'x-correlation-id', 'accept'];

export async function proxyRequest(request: NextRequest, segments: string[]) {
  const target = new URL(`/${segments.join('/')}`, process.env.API_URL ?? 'http://localhost:8000');
  target.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of forwarded) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();
  const upstream = await fetch(target, { method: request.method, headers, body, redirect: 'manual' });
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key === 'content-encoding' || key === 'content-length' || key === 'set-cookie') return;
    responseHeaders.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);
  return new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
}

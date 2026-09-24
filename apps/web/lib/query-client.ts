import { QueryClient } from '@tanstack/react-query';

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') return makeClient();
  return (browserClient ??= makeClient());
}

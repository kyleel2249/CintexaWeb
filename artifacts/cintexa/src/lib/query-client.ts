import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

/**
 * Retry only what can plausibly succeed on a second try: one retry for network failures and 5xx.
 * Never retry 4xx or "server returned HTML" (API not deployed) — the default 3 retries with backoff
 * kept dashboard cards on a loading skeleton for ~7 seconds before showing anything.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (error instanceof ApiError) return error.status === 0 || error.status >= 500;
  return true;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: 800,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
}

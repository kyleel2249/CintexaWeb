const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/** Separate from lib/api.ts on purpose: admin calls authenticate with a static
 * key, never a Clerk token, and must never accidentally share that code path. */
export async function adminFetch<T>(
  path: string,
  adminKey: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ? JSON.stringify(body.error) : res.statusText);
  }

  return res.json() as Promise<T>;
}

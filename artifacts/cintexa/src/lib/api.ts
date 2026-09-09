const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Thin fetch wrapper: JSON in/out, Clerk bearer token, typed error on non-2xx. */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // fetch() itself threw — DNS failure, connection refused, CORS block. The
    // API server is unreachable at API_BASE, full stop.
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    // A non-JSON 200 here (almost always HTML) means the request never hit
    // the API at all — most commonly VITE_API_BASE_URL is unset/misconfigured
    // and a static host's SPA fallback served index.html instead of JSON.
    // Surface something actionable instead of letting res.json() throw a
    // cryptic "Unexpected token '<'" parse error.
    throw new ApiError(
      res.status,
      "The server didn't return a valid response. This usually means the API isn't reachable — check VITE_API_BASE_URL.",
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

import { describe, expect, it, vi, afterEach } from "vitest";
import { apiFetch, ApiError } from "../api";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws a clear ApiError when the response isn't JSON (e.g. a static host's SPA fallback HTML)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!doctype html><html>...</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    await expect(apiFetch("/customer/me")).rejects.toMatchObject({
      name: "ApiError",
      message: expect.stringMatching(/VITE_API_BASE_URL/i),
    });
  });

  it("throws a clear ApiError when fetch itself fails (network/DNS/CORS)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiFetch("/customer/me")).rejects.toMatchObject({
      name: "ApiError",
      message: expect.stringMatching(/can't reach the server/i),
    });
  });

  it("throws ApiError with the server's error message on a JSON error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(apiFetch("/customer/me")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Not authenticated",
    });
  });

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ profile: null }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(apiFetch("/customer/me")).resolves.toEqual({ profile: null });
  });
});

/**
 * Rate limiting on the Express API. Uses only routes that need no database (health, unknown paths, webhook
 * signature rejection), so it runs everywhere `npm test` does.
 */
import { beforeAll, describe, expect, it } from "vitest";

describe("Express rate limits", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let request: any;
  let createApp: typeof import("../app.js").createApp;

  beforeAll(async () => {
    process.env.ADMIN_API_KEY ??= "test-admin-key-at-least-16-chars";
    process.env.WEBHOOK_SECRET ??= "test-webhook-secret-16-chars";
    process.env.NODE_ENV ??= "test";
    // Never connected to: none of the routes exercised here touch the database.
    process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";
    process.env.TRUST_PROXY = "1";
    request = (await import("supertest")).default;
    ({ createApp } = await import("../app.js"));
  });

  it("throttles unknown paths too (no route escapes the global ceiling)", async () => {
    const app = createApp();
    let last = 0;
    for (let i = 0; i < 305; i++) last = (await request(app).get("/does-not-exist")).status;
    expect(last).toBe(429);
  }, 30_000);

  it("returns the JSON error shape and standard RateLimit headers", async () => {
    const app = createApp();
    let res = await request(app).get("/does-not-exist");
    expect(res.headers["ratelimit-limit"]).toBeDefined();
    for (let i = 0; i < 305; i++) res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "Too many requests. Please try again later." });
    expect(res.headers["retry-after"]).toBeDefined();
  }, 30_000);

  it("counts each client separately via X-Forwarded-For", async () => {
    const app = createApp();
    for (let i = 0; i < 305; i++) await request(app).get("/nope").set("X-Forwarded-For", "203.0.113.10");
    expect((await request(app).get("/nope").set("X-Forwarded-For", "203.0.113.10")).status).toBe(429);
    expect((await request(app).get("/nope").set("X-Forwarded-For", "203.0.113.11")).status).toBe(404);
  }, 30_000);

  it("rate-limits /webhooks (previously unlimited) before any body parsing", async () => {
    const app = createApp();
    let last = 0;
    for (let i = 0; i < 305; i++) last = (await request(app).post("/webhooks/anything").send("{}")).status;
    expect(last).toBe(429);
  }, 30_000);

  it("keeps /health on its own, larger bucket", async () => {
    const app = createApp();
    for (let i = 0; i < 305; i++) await request(app).get("/does-not-exist");
    expect((await request(app).get("/health")).status).not.toBe(429);
  }, 30_000);
});

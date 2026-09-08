/**
 * Integration tests against a real Postgres instance. Requires DATABASE_URL
 * to point at a reachable database with the schema migrated (see lib/db).
 * Skips gracefully if DATABASE_URL isn't set, so `npm test` still passes in
 * environments without a database configured.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb("API integration", () => {
  let app: import("express").Express;
  // supertest's type exports don't play cleanly with NodeNext + esModuleInterop;
  // `any` here is scoped to this test file only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let request: any;

  beforeAll(async () => {
    process.env.ADMIN_API_KEY ??= "test-admin-key-at-least-16-chars";
    process.env.WEBHOOK_SECRET ??= "test-webhook-secret-16-chars";
    process.env.CLERK_SECRET_KEY ??= "sk_test_placeholder";
    process.env.CLERK_PUBLISHABLE_KEY ??= "pk_test_placeholder";
    process.env.NODE_ENV ??= "test";

    const { createApp } = await import("../app.js");
    request = (await import("supertest")).default;
    app = createApp();
  });

  it("GET /health returns ok without touching auth", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/admin/customers rejects a missing admin key", async () => {
    const res = await request(app).get("/api/admin/customers");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/customers succeeds with the admin key", async () => {
    const res = await request(app).get("/api/admin/customers").set("x-admin-key", process.env.ADMIN_API_KEY!);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.customers)).toBe(true);
  });

  it("POST /api/admin/agents/run runs the content_idea agent and persists a task", async () => {
    const res = await request(app)
      .post("/api/admin/agents/run")
      .set("x-admin-key", process.env.ADMIN_API_KEY!)
      .send({ role: "content_idea", input: { topic: "customer loyalty", format: "blog", count: 2 } });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe("completed");
    expect(res.body.task.output.ideas).toHaveLength(2);
  });

  it("POST /api/admin/agents/run rejects invalid input for the role", async () => {
    const res = await request(app)
      .post("/api/admin/agents/run")
      .set("x-admin-key", process.env.ADMIN_API_KEY!)
      .send({ role: "sales", input: { leadStage: "not-a-real-stage" } });

    expect(res.status).toBe(400);
  });

  it("GET /api/leaderboard is public and returns an array", async () => {
    const res = await request(app).get("/api/leaderboard");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.leaderboard)).toBe(true);
  });
});

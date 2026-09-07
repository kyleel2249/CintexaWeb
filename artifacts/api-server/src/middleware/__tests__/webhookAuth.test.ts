import { createHmac } from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../lib/env.js", () => ({ env: { WEBHOOK_SECRET: "test-secret" } }));

const { requireWebhookSignature } = await import("../webhookAuth.js");

function mockRes() {
  const res: { statusCode?: number; body?: unknown; status: (c: number) => typeof res; json: (b: unknown) => typeof res } = {
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}

describe("requireWebhookSignature", () => {
  let next: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    next = vi.fn();
  });

  it("calls next() when the HMAC signature is valid", () => {
    const rawBody = Buffer.from(JSON.stringify({ hello: "world" }));
    const signature = createHmac("sha256", "test-secret").update(rawBody).digest("hex");
    const req = { header: (h: string) => (h === "x-webhook-signature" ? signature : undefined), rawBody } as never;
    const res = mockRes();
    requireWebhookSignature(req, res as never, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a tampered body", () => {
    const rawBody = Buffer.from(JSON.stringify({ hello: "world" }));
    const signature = createHmac("sha256", "test-secret").update(rawBody).digest("hex");
    const tamperedBody = Buffer.from(JSON.stringify({ hello: "tampered" }));
    const req = { header: (h: string) => (h === "x-webhook-signature" ? signature : undefined), rawBody: tamperedBody } as never;
    const res = mockRes();
    requireWebhookSignature(req, res as never, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("rejects when the signature header is missing", () => {
    const req = { header: () => undefined, rawBody: Buffer.from("{}") } as never;
    const res = mockRes();
    requireWebhookSignature(req, res as never, next);
    expect(res.statusCode).toBe(401);
  });
});

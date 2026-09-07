import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../lib/env.js", () => ({ env: { ADMIN_API_KEY: "correct-key" } }));

const { requireAdminKey } = await import("../adminAuth.js");

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

describe("requireAdminKey", () => {
  let next: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    next = vi.fn();
  });

  it("calls next() when the key matches", () => {
    const req = { header: (_: string) => "correct-key" } as never;
    const res = mockRes();
    requireAdminKey(req, res as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeUndefined();
  });

  it("returns 401 when the key is missing", () => {
    const req = { header: (_: string) => undefined } as never;
    const res = mockRes();
    requireAdminKey(req, res as never, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when the key is wrong", () => {
    const req = { header: (_: string) => "wrong-key" } as never;
    const res = mockRes();
    requireAdminKey(req, res as never, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

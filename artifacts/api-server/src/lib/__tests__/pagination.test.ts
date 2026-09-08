import { describe, expect, it } from "vitest";
import { parsePageParams, buildPaginationMeta } from "../pagination.js";

function mockReq(query: Record<string, string>) {
  return { query } as never;
}

describe("parsePageParams", () => {
  it("defaults to limit 50, offset 0 when nothing is provided", () => {
    expect(parsePageParams(mockReq({}))).toEqual({ limit: 50, offset: 0 });
  });

  it("respects valid limit and offset", () => {
    expect(parsePageParams(mockReq({ limit: "10", offset: "20" }))).toEqual({ limit: 10, offset: 20 });
  });

  it("clamps limit to the 200 max", () => {
    expect(parsePageParams(mockReq({ limit: "9999" })).limit).toBe(200);
  });

  it("ignores invalid/negative values and falls back to defaults", () => {
    expect(parsePageParams(mockReq({ limit: "-5", offset: "-10" }))).toEqual({ limit: 50, offset: 0 });
    expect(parsePageParams(mockReq({ limit: "not-a-number" })).limit).toBe(50);
  });
});

describe("buildPaginationMeta", () => {
  it("reports hasMore true when there are more rows beyond this page", () => {
    const meta = buildPaginationMeta({ limit: 10, offset: 0 }, 10, 25);
    expect(meta).toEqual({ limit: 10, offset: 0, total: 25, hasMore: true });
  });

  it("reports hasMore false on the last page", () => {
    const meta = buildPaginationMeta({ limit: 10, offset: 20 }, 5, 25);
    expect(meta.hasMore).toBe(false);
  });

  it("reports hasMore false when the page is empty", () => {
    const meta = buildPaginationMeta({ limit: 10, offset: 100 }, 0, 25);
    expect(meta.hasMore).toBe(false);
  });
});

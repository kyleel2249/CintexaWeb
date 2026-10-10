import { describe, expect, it } from "vitest";
import { ApiError } from "../api";
import { shouldRetry } from "../query-client";

describe("shouldRetry", () => {
  it("retries network failures and 5xx once", () => {
    expect(shouldRetry(0, new ApiError(0, "offline"))).toBe(true);
    expect(shouldRetry(0, new ApiError(503, "down"))).toBe(true);
    expect(shouldRetry(1, new ApiError(503, "down"))).toBe(false);
  });
  it("never retries client errors or an API that isn't deployed (HTML 200)", () => {
    expect(shouldRetry(0, new ApiError(401, "no"))).toBe(false);
    expect(shouldRetry(0, new ApiError(404, "no"))).toBe(false);
    expect(shouldRetry(0, new ApiError(200, "not json"))).toBe(false);
  });
});

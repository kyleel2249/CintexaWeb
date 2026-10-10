import { describe, expect, it } from "vitest";
import { isSettled, statusLabel, statusTone } from "../contributions";

describe("contribution status rules", () => {
  it("counts paid/completed and status-less rows, nothing else", () => {
    for (const s of ["paid", "completed", "PAID", " succeeded ", undefined, null, ""]) {
      expect(isSettled({ status: s as string | undefined }), String(s)).toBe(true);
    }
    for (const s of ["pending", "failed", "cancelled", "refunded"]) {
      expect(isSettled({ status: s }), s).toBe(false);
    }
  });
  it("maps statuses to badge tones", () => {
    expect(statusTone("paid")).toBe("success");
    expect(statusTone("pending")).toBe("warning");
    expect(statusTone("failed")).toBe("danger");
    expect(statusLabel(undefined)).toBe("recorded");
  });
});

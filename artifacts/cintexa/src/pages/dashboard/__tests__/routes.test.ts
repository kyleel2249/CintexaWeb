import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DASHBOARD_PATHS, DASHBOARD_TABS } from "../routes";

describe("dashboard routes", () => {
  it("every tab is a /dashboard path and unique", () => {
    const hrefs = DASHBOARD_TABS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const h of hrefs) expect(h.startsWith("/dashboard")).toBe(true);
    expect([...DASHBOARD_PATHS]).toEqual(hrefs);
  });

  it("App.tsx renders a route for every tab (a tab can never lead to the 404 page)", () => {
    const app = fs.readFileSync(path.resolve(__dirname, "../../../App.tsx"), "utf8");
    for (const { href } of DASHBOARD_TABS) {
      expect(app, href).toContain(`"${href}":`);
    }
    expect(app).toContain("DASHBOARD_PATHS.map");
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JOBS, getOpenJobs } from "../jobs";

const root = path.resolve(__dirname, "../../..");

describe("every vacancy has its own URL", () => {
  it("slugs are unique, URL-safe and not reserved", () => {
    const slugs = JOBS.map((j) => j.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s, s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(["feed", "feed-xml", "jobs", "category"]).not.toContain(s);
    }
  });

  it("the sitemap lists /careers and a separate URL for each open vacancy", () => {
    const sitemap = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
    expect(sitemap).toContain("<loc>https://cintexa.com/careers</loc>");
    for (const job of getOpenJobs()) {
      expect(sitemap, job.slug).toContain(`<loc>https://cintexa.com/careers/${job.slug}</loc>`);
    }
  });

  it("the router sends /careers/:id to the vacancy page (not the list)", () => {
    const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
    expect(app).toMatch(/path="\/careers\/:id"/);
    expect(app).toMatch(/path="\/careers"/);
  });
});

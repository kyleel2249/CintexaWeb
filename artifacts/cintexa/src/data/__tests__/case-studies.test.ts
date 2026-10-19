import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CASE_IMAGE_SIZE, CASE_SECTIONS, CASE_STUDIES, caseImagePath, caseToc, contentHash, getCaseStudies, getCaseStudy, readingMinutes, type CaseStudy } from "../case-studies";
// @ts-expect-error - plain build helper (no types)
import { readImageSize } from "../../../scripts/image-info.mjs";

const root = path.resolve(__dirname, "../../..");
const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
const textOf = (c: CaseStudy) =>
  [c.title, c.summary, c.problem, c.assessment, c.solution, c.implementation, c.results, c.technology, ...c.technologyTags, ...c.metrics.flatMap((m) => [m.name, m.why, m.how])].join("\n");

describe("case-studies.json integrity", () => {
  it("has unique, URL-safe slugs and real content in every field", () => {
    expect(new Set(CASE_STUDIES.map((c) => c.slug)).size).toBe(CASE_STUDIES.length);
    for (const c of CASE_STUDIES) {
      expect(c.slug, c.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      for (const f of ["service", "industry"] as const) expect(c[f].trim().length, `${c.slug}.${f}`).toBeGreaterThanOrEqual(3);
      for (const f of ["title", "summary", "problem", "assessment", "solution", "implementation", "results", "technology"] as const) {
        expect(c[f].trim().length, `${c.slug}.${f}`).toBeGreaterThan(20);
      }
      expect(c.technologyTags.length, c.slug).toBeGreaterThan(0);
      expect(c.metrics.length, c.slug).toBeGreaterThanOrEqual(3);
      for (const m of c.metrics) for (const k of ["name", "why", "how"] as const) expect(m[k].trim().length, `${c.slug}.${m.name}.${k}`).toBeGreaterThan(5);
      expect(["illustrative", "verified"]).toContain(c.status);
      expect(c.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.dateUpdated >= c.datePublished, c.slug).toBe(true);
    }
  });

  it("links each case to a service page that really exists", () => {
    for (const c of CASE_STUDIES) {
      expect(c.serviceHref, c.slug).toMatch(/^\/solutions\/[a-z-]+$/);
      expect(app, `${c.slug} → ${c.serviceHref}`).toContain(`path="${c.serviceHref}"`);
    }
  });

  it("never invents numbers: illustrative cases contain no figures, clients or evidence", () => {
    const figure = /\d+(\.\d+)?\s?%|GH[S₵]|\$\s?\d|\b\d{2,}\s+(clients|customers|orders|users|leads|sales)\b|\b\d+x\b/i;
    for (const c of CASE_STUDIES.filter((x) => x.status === "illustrative")) {
      expect(textOf(c), c.slug).not.toMatch(figure);
      expect(c.client, c.slug).toBeUndefined();
      expect(c.evidence, c.slug).toBeUndefined();
    }
  });

  it("a verified case needs a named client, recorded permission and dated, sourced evidence", () => {
    for (const c of CASE_STUDIES.filter((x) => x.status === "verified")) {
      expect(c.client?.trim(), c.slug).toBeTruthy();
      expect(c.permission, c.slug).toBe(true);
      expect(c.evidence?.length, c.slug).toBeGreaterThan(0);
      for (const e of c.evidence ?? []) for (const k of ["metric", "before", "after", "period", "source"] as const) expect(e[k]?.trim(), `${c.slug}.${k}`).toBeTruthy();
    }
  });

  it("every case has a current, correctly sized preview card (its file name is tied to what it shows)", () => {
    for (const c of CASE_STUDIES) {
      const rel = caseImagePath(c);
      const file = path.join(root, "public", rel);
      expect(fs.existsSync(file), `${c.slug}: ${rel} — run npx tsx scripts/make-case-images.mjs`).toBe(true);
      const info = readImageSize(fs.readFileSync(file));
      expect(info, rel).toMatchObject({ type: "image/png", width: CASE_IMAGE_SIZE.width, height: CASE_IMAGE_SIZE.height });
    }
    // no stale cards left behind
    const wanted = new Set(CASE_STUDIES.map((c) => path.basename(caseImagePath(c))));
    const present = fs.readdirSync(path.join(root, "public/case-studies")).filter((f) => f.endsWith(".png"));
    expect(present.filter((f) => !wanted.has(f))).toEqual([]);
  });

  it("editing what the card shows changes its expected file name (so stale images can't ship)", () => {
    const c = CASE_STUDIES[0]!;
    expect(caseImagePath({ ...c, title: `${c.title}!` })).not.toBe(caseImagePath(c));
    expect(caseImagePath({ ...c, service: "Other" })).not.toBe(caseImagePath(c));
    expect(caseImagePath({ ...c, status: "verified" })).not.toBe(caseImagePath(c));
    const sameCard: CaseStudy = { ...c, summary: "different summary" }; // summary is not shown on the card
    expect(caseImagePath(sameCard)).toBe(caseImagePath(c));
    expect(contentHash("a")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("lists newest first, finds by slug, and builds a contents list ending in the measurement plan", () => {
    const list = getCaseStudies();
    const dates = list.map((c) => c.dateUpdated);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(getCaseStudy("nope")).toBeUndefined();
    const c = CASE_STUDIES[0]!;
    expect(getCaseStudy(c.slug)).toBe(c);
    expect(caseToc(c).map((t) => t.id)).toEqual([...CASE_SECTIONS.slice(0, 5).map((s) => s.id), "measurement", "technology"]);
    expect(caseToc({ ...c, status: "verified", evidence: [{ metric: "m", before: "b", after: "a", period: "p", source: "s" }] }).map((t) => t.id)).toContain("evidence");
    expect(readingMinutes(c)).toBeGreaterThanOrEqual(1);
  });

  it("the sitemap lists /case-studies and a separate URL for every case", () => {
    const sitemap = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
    expect(sitemap).toContain("<loc>https://cintexa.com/case-studies</loc>");
    for (const c of CASE_STUDIES) expect(sitemap, c.slug).toContain(`<loc>https://cintexa.com/case-studies/${c.slug}</loc>`);
  });

  it("the router has a page for each case, and the old inline page is gone", () => {
    expect(app).toMatch(/path="\/case-studies\/:slug"/);
    expect(app).toMatch(/path="\/case-studies"/);
    expect(fs.readFileSync(path.join(root, "src/pages/TrustPages.tsx"), "utf8")).not.toMatch(/export function CaseStudies|const CASES\b/);
  });
});

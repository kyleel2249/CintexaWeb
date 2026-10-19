import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CASE_STUDIES, caseImagePath, getCaseStudies } from "../case-studies";
import { caseListSeo, caseNotFoundSeo, caseSeo } from "../case-seo";
// @ts-expect-error - plain build script (no types); guarded so importing it does not run the build.
import { renderCaseListPage, renderCasePage, validateCaseImages } from "../../../scripts/prerender-case-studies.mjs";

const SHELL = `<!doctype html><html><head>
<link rel="canonical" href="https://cintexa.com/" />
<meta name="description" content="HOME DESC" />
<meta property="og:title" content="HOME" />
<meta property="og:image" content="https://images.unsplash.com/home.jpg" />
<meta name="twitter:image" content="https://images.unsplash.com/home.jpg" />
<title>Home</title></head><body><div id="root"></div></body></html>`;
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
const cases = getCaseStudies();

describe("caseSeo (social preview + structured data come from the case)", () => {
  it("uses each case's own canonical URL, image, size and title", () => {
    for (const c of cases) {
      const seo = caseSeo(c);
      expect(seo.canonical).toBe(`https://cintexa.com/case-studies/${c.slug}`);
      expect(seo.image).toBe(`https://cintexa.com${caseImagePath(c)}`);
      expect([seo.imageWidth, seo.imageHeight, seo.imageType]).toEqual([1200, 630, "image/png"]);
      expect(seo.ogType).toBe("article");
      expect(seo.twitterCard).toBe("summary_large_image");
      expect(seo.socialTitle).toContain("Illustrative scenario"); // the preview is honest about what it is
      expect(seo.robots).toContain("index");
    }
  });
  it("changes when the case changes (nothing static)", () => {
    const c = cases[0]!;
    const edited = { ...c, title: "A different title", summary: "A different summary." };
    expect(caseSeo(edited).socialTitle).toContain("A different title");
    expect(caseSeo(edited).description).toBe("A different summary.");
    expect(caseSeo(edited).image).not.toBe(caseSeo(c).image);
  });
  it("emits a valid Article with the real publisher, breadcrumb and no undefined", () => {
    const c = cases[0]!;
    const graph = (caseSeo(c).jsonLd as { "@graph": Record<string, unknown>[] })["@graph"];
    const article = graph.find((n) => n["@type"] === "Article")!;
    expect(article).toMatchObject({ headline: c.title, datePublished: c.datePublished, dateModified: c.dateUpdated, articleSection: c.service, genre: "Illustrative scenario" });
    expect(article.publisher).toMatchObject({ "@type": "Organization", name: "CINTEXA" });
    expect(graph.find((n) => n["@type"] === "BreadcrumbList")).toBeTruthy();
    expect(JSON.stringify(graph)).not.toContain("undefined");
    expect(JSON.stringify(graph)).not.toMatch(/Review|aggregateRating/); // no invented reviews or ratings
  });
  it("the list page previews the newest case and lists every URL", () => {
    const seo = caseListSeo(cases);
    expect(seo.image).toBe(`https://cintexa.com${caseImagePath(cases[0]!)}`);
    const list = (seo.jsonLd as { "@graph": { "@type": string; itemListElement?: { url: string }[] }[] })["@graph"].find((n) => n["@type"] === "ItemList")!;
    expect(list.itemListElement!.map((i) => i.url)).toEqual(cases.map((c) => `https://cintexa.com/case-studies/${c.slug}`));
  });
  it("unknown cases are kept out of the index", () => {
    expect(caseNotFoundSeo().robots).toContain("noindex");
    expect(caseListSeo([]).twitterCard).toBe("summary");
  });
});

describe("prerendered HTML (what link-preview bots read)", () => {
  it("each case page carries only its own preview — no homepage leftovers", () => {
    for (const c of cases) {
      const html = renderCasePage(SHELL, c) as string;
      expect(html).not.toContain("unsplash");
      expect(html).not.toContain("HOME");
      expect(count(html, /property="og:image"/g)).toBe(1);
      expect(count(html, /name="twitter:image"/g)).toBe(1);
      expect(html).toContain(`<meta property="og:image" content="https://cintexa.com${caseImagePath(c)}" />`);
      expect(html).toContain('<meta property="og:image:width" content="1200" />');
      expect(html).toContain('<meta property="og:type" content="article" />');
      expect(html).toContain(`<link rel="canonical" href="https://cintexa.com/case-studies/${c.slug}" />`);
      expect(count(html, /<link rel="canonical"/g)).toBe(1);
      expect(count(html, /application\/ld\+json/g)).toBe(1);
      expect(html).toContain(c.summary.slice(0, 30));
      expect(html).toContain(c.problem.slice(0, 30)); // real content for no-JS crawlers
    }
  });
  it("the list page links to every case and previews the newest", () => {
    const html = renderCaseListPage(SHELL, cases) as string;
    for (const c of cases) expect(html).toContain(`href="/case-studies/${c.slug}"`);
    expect(html).toContain(`<meta property="og:image" content="https://cintexa.com${caseImagePath(cases[0]!)}" />`);
    expect(count(html, /property="og:image"/g)).toBe(1);
  });
  it("escapes case text", () => {
    const html = renderCasePage(SHELL, { ...cases[0]!, title: "A <b>bold</b> & title" }) as string;
    expect(html).toContain("A &lt;b&gt;bold&lt;/b&gt; &amp; title");
    expect(html).not.toContain("<b>bold</b>");
  });
});

describe("validateCaseImages (fails the build instead of shipping a broken preview)", () => {
  it("passes for the real images", () => {
    expect(validateCaseImages(CASE_STUDIES, path.resolve(__dirname, "../../../public"))).toEqual([]);
  });
  it("reports missing and wrongly sized images", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
    fs.mkdirSync(path.join(dir, "case-studies"));
    const [a, b] = [CASE_STUDIES[0]!, CASE_STUDIES[1]!];
    // b: a real PNG header, but 10x10
    const png = Buffer.alloc(33);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png, 0);
    png.writeUInt32BE(10, 16);
    png.writeUInt32BE(10, 20);
    fs.writeFileSync(path.join(dir, caseImagePath(b)), png);
    const problems = validateCaseImages([a, b], dir) as string[];
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/missing/);
    expect(problems[1]).toMatch(/10x10, expected 1200x630/);
  });
});

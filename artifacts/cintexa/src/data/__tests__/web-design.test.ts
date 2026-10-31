import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WEB_DESIGN, WEB_DESIGN_ALIAS, WEB_DESIGN_PATH } from "../web-design";
import { WEB_DESIGN_URL, webDesignSeo } from "../web-design-seo";
// @ts-expect-error - plain build scripts (no types); guarded so importing them does not run the build.
import { renderServicesPage } from "../../../scripts/prerender-services.mjs";
// @ts-expect-error - plain build script (no types)
import { validateSitemap } from "../../../scripts/validate-sitemap.mjs";

// Minimal shape of the JSON-LD nodes asserted below.
type GraphNode = {
  "@type": string;
  provider?: unknown;
  mainEntity: { name: string }[];
  itemListElement: { item: string }[];
};

const root = path.resolve(__dirname, "../../..");
const SHELL = `<!doctype html><html><head><title>Home</title></head><body><div id="root"></div></body></html>`;

describe("Web design & development page data + SEO", () => {
  it("keeps one canonical URL and redirects the preferred alias to it (no duplicate page)", () => {
    expect(WEB_DESIGN_PATH).toBe("/solutions/website-development");
    expect(WEB_DESIGN_URL).toBe("https://cintexa.com/solutions/website-development");
    const redirects = fs.readFileSync(path.join(root, "public/_redirects"), "utf8");
    expect(redirects).toContain(`${WEB_DESIGN_ALIAS}    ${WEB_DESIGN_PATH}    301`);
    expect(redirects.indexOf(WEB_DESIGN_ALIAS)).toBeLessThan(redirects.indexOf("/*"));
  });

  it("has the planned metadata, a single H1 topic and all service categories", () => {
    const seo = webDesignSeo();
    expect(seo.title).toBe("Web Design & Development Company in Ghana | CINTEXA");
    expect(seo.canonical).toBe(WEB_DESIGN_URL);
    expect(seo.robots).toContain("index");
    expect(seo.description.length).toBeLessThanOrEqual(160);
    expect(WEB_DESIGN.h1).toBe("Professional Web Design & Development Company");
    expect(WEB_DESIGN.services).toHaveLength(10);
    expect(new Set(WEB_DESIGN.services.map((s) => s.id)).size).toBe(10);
    expect(fs.existsSync(path.join(root, "public", WEB_DESIGN.image))).toBe(true);
  });

  it("every internal link and CTA points at a real route", () => {
    const routes = ["/contact", "/get-started", "/case-studies", "/solutions/ecommerce", "/solutions/software-development", "/solutions/marketing", "/solutions/sales"];
    const hrefs = [...WEB_DESIGN.services.map((s) => s.cta.href), ...WEB_DESIGN.related.map((r) => r.href)];
    for (const h of hrefs) expect(routes, h).toContain(h);
  });

  it("makes no unsupported promises (rankings, guarantees, fabricated stats or prices)", () => {
    const text = JSON.stringify(WEB_DESIGN).toLowerCase();
    expect(text).not.toMatch(/guaranteed (first|#1|top)|\b#1\b|number one|best web/);
    expect(text).not.toMatch(/gh[₵c]\s?\d|\$\s?\d|\d+\s?%/);
    expect(text).not.toMatch(/testimonial|award-winning/);
  });

  it("JSON-LD only describes visible content (FAQ mirrors the page FAQ; breadcrumb matches)", () => {
    const g = (webDesignSeo().jsonLd as { "@graph": GraphNode[] })["@graph"];
    const faq = g.find((n) => n["@type"] === "FAQPage")!;
    expect(faq.mainEntity.map((q) => q.name)).toEqual(WEB_DESIGN.faqs.map((f) => f.q));
    expect(g.find((n) => n["@type"] === "Service")?.provider).toEqual({ "@id": "https://cintexa.com/#organization" });
    const bc = g.find((n) => n["@type"] === "BreadcrumbList")!;
    expect(bc.itemListElement.map((i) => i.item)).toEqual(["https://cintexa.com/", WEB_DESIGN_URL]);
    // telephone is allowed: it is the published contact number carried by the shared Organization node (data/site-entity.ts).
    expect(JSON.stringify(g)).not.toMatch(/"(aggregateRating|review|priceRange|openingHours)":/);
  });

  it("prerenders crawlable HTML with real content and the full head", () => {
    const html = renderServicesPage(SHELL);
    expect(html).toContain(`<link rel="canonical" href="${WEB_DESIGN_URL}" />`);
    expect(html).toContain("<title>Web Design &amp; Development Company in Ghana | CINTEXA</title>");
    expect(html).toContain('property="og:image" content="https://cintexa.com/images/og-web-design-development.png"');
    expect(html).toContain("<h1");
    for (const s of WEB_DESIGN.services) expect(html).toContain(s.id);
    for (const f of WEB_DESIGN.faqs) expect(html).toContain(f.q.replace(/&/g, "&amp;"));
    expect(html).toContain('href="/contact"');
    expect(html).toContain("application/ld+json");
  });
});

describe("sitemap", () => {
  const xml = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
  it("is valid and includes the service page with a real lastmod", () => {
    const { problems, urls } = validateSitemap(xml);
    expect(problems).toEqual([]);
    expect(urls).toContain(WEB_DESIGN_URL);
    expect(xml).toContain(`<loc>${WEB_DESIGN_URL}</loc>\n    <lastmod>${WEB_DESIGN.dateUpdated}</lastmod>`);
    expect(urls).not.toContain("https://cintexa.com/services/web-design-development"); // alias is redirected, not listed
  });
  it("the validator rejects duplicates, private routes and off-domain URLs", () => {
    const bad = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://cintexa.com/a</loc></url>\n<url><loc>https://cintexa.com/a</loc></url>\n<url><loc>https://cintexa.com/admin</loc></url>\n<url><loc>http://evil.example/x</loc></url>\n</urlset>\n`;
    const { problems } = validateSitemap(bad);
    expect(problems.join("|")).toMatch(/duplicate/);
    expect(problems.join("|")).toMatch(/private\/blocked/);
    expect(problems.join("|")).toMatch(/HTTPS/);
  });
});

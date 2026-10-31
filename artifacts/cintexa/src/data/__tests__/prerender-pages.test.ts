import { describe, expect, it } from "vitest";
import { POSTS } from "../blog-posts";
import { STATIC_PAGES } from "../seo-pages";
// @ts-expect-error - plain build script (no types); guarded so importing it does not run the build.
import { renderLlmsTxt, renderPages } from "../../../scripts/prerender-pages.mjs";

const SHELL = `<!doctype html><html><head>
<link rel="canonical" href="https://cintexa.com/" />
<meta name="description" content="HOME DESC" />
<meta property="og:title" content="HOME" />
<meta property="og:image" content="https://example.test/home.jpg" />
<meta name="twitter:image" content="https://example.test/home.jpg" />
<title>Home</title></head><body><div id="root"></div></body></html>`;

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;
const files: Record<string, string> = renderPages(SHELL);
const pages = Object.entries(files).filter(([k]) => k.endsWith(".html"));

describe("prerendered public pages", () => {
  it("writes one file per static page, per article, plus 404 and app shell", () => {
    expect(Object.keys(files)).toEqual(expect.arrayContaining(["index.html", "404.html", "app-shell/index.html", "llms.txt", "llms-full.txt"]));
    expect(pages.length).toBe(STATIC_PAGES.length + POSTS.length + 2);
  });

  it("rejects a shell that is already prerendered", () => {
    expect(() => renderPages(SHELL.replace('<div id="root"></div>', '<div id="root"><p>x</p></div>'))).toThrow();
  });

  it("gives every indexable page its own title, canonical, one h1 and parseable JSON-LD, with no home leftovers", () => {
    const titles = new Set<string>();
    for (const [name, html] of pages) {
      if (name === "404.html" || name.startsWith("app-shell")) continue;
      const title = /<title>([^<]*)<\/title>/.exec(html)![1];
      expect(titles.has(title), `duplicate title ${title}`).toBe(false);
      titles.add(title);
      expect(html).not.toContain("HOME DESC");
      expect(count(html, /rel="canonical"/g)).toBe(1);
      expect(count(html, /<h1[\s>]/g), name).toBe(1);
      for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) expect(() => JSON.parse(m[1])).not.toThrow();
    }
  });

  it("marks 404 and the app shell noindex with no canonical", () => {
    for (const name of ["404.html", "app-shell/index.html"]) {
      expect(files[name]).toMatch(/noindex/);
      expect(files[name]).not.toMatch(/rel="canonical"/);
    }
  });

  it("never emits ratings, reviews or offers in structured data", () => {
    for (const [, html] of pages) expect(html).not.toMatch(/"(AggregateRating|Review|Offer)"/);
  });

  it("llms.txt links only to cintexa.com and lists every article", () => {
    const txt: string = renderLlmsTxt();
    for (const m of txt.matchAll(/\]\((https?:[^)]+)\)/g)) expect(m[1].startsWith("https://cintexa.com")).toBe(true);
    for (const p of POSTS) expect(txt).toContain(`/blog/${p.slug}`);
  });
});

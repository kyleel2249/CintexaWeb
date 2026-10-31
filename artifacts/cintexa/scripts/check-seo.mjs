/**
 * Build-time SEO audit of dist/ (run after the prerender scripts). Exits 1 on any ERROR; WARN is informational.
 *   tsx scripts/check-seo.mjs [distDir]
 * Checks every prerendered HTML page: title, description, canonical, robots, one <h1>, JSON-LD parses, images have
 * alt + width/height, internal links resolve, sitemap URLs exist and are indexable, no duplicate titles/descriptions,
 * robots.txt references the sitemap, llms.txt links resolve.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(process.argv[2] ?? path.join(root, "dist"));
const SITE = "https://cintexa.com";
const errors = [];
const warns = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warns.push(`${f}: ${m}`);

if (!fs.existsSync(dist)) {
  console.error(`check-seo: ${dist} not found — build first`);
  process.exit(1);
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]));
const all = walk(dist).map((f) => path.relative(dist, f).split(path.sep).join("/"));
const htmlFiles = all.filter((f) => f.endsWith(".html") && !["checksum.html"].includes(f));
const fileSet = new Set(all);

const redirects = fs.existsSync(path.join(dist, "_redirects")) ? fs.readFileSync(path.join(dist, "_redirects"), "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.trim().split(/\s+/)) : [];
const redirected = (p) => redirects.some(([from, , code]) => (from.endsWith("/*") ? p.startsWith(from.slice(0, -1)) : from === p || from === p + "/") && code);

function resolves(urlPath) {
  const p = decodeURIComponent(urlPath.split("#")[0].split("?")[0]);
  if (p === "/" || p === "") return fileSet.has("index.html");
  const rel = p.replace(/^\//, "").replace(/\/$/, "");
  return fileSet.has(rel) || fileSet.has(`${rel}/index.html`) || fileSet.has(`${rel}.html`) || redirected(p);
}
const pathOf = (rel) => (rel === "index.html" ? "/" : "/" + rel.replace(/\/?index\.html$/, "").replace(/\.html$/, ""));

const titles = new Map();
const descs = new Map();
const indexable = new Set();
const attr = (html, re) => (html.match(re) || [])[1];

for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(dist, f), "utf8");
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/) ?? "";
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  const noindex = /noindex/i.test(robots);
  if (!title) err(f, "missing <title>");
  else if (title.length > 90) warn(f, `title is ${title.length} chars`);
  if (!noindex) {
    indexable.add(f);
    if (!desc) err(f, "missing meta description");
    else {
      if (desc.length < 50 || desc.length > 175) warn(f, `description is ${desc.length} chars`);
      (descs.get(desc) ?? descs.set(desc, []).get(desc)).push(f);
    }
    if (title) (titles.get(title) ?? titles.set(title, []).get(title)).push(f);
    if (!canonical) err(f, "missing canonical");
    else if (f !== "404.html" && !f.startsWith("app-shell/") && canonical.replace(/\/$/, "") !== (SITE + pathOf(f)).replace(/\/$/, "")) err(f, `canonical ${canonical} does not match its own URL ${SITE + pathOf(f)}`);
    if (!/property="og:title"/.test(html) || !/property="og:image"/.test(html) || !/name="twitter:card"/.test(html)) err(f, "missing Open Graph / Twitter tags");
    const h1s = (html.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) err(f, `expected exactly one <h1>, found ${h1s}`);
  } else if (canonical && canonical === SITE + "/" && f !== "index.html") err(f, "noindex page canonicalises to the home page");
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const nodes = j["@graph"] ?? [j];
      for (const n of nodes) if (/"(Review|AggregateRating|Offer)"/.test(JSON.stringify(n["@type"] ?? "")) ) err(f, `JSON-LD contains ${n["@type"]} — not allowed without verified data`);
    } catch (e) {
      err(f, `invalid JSON-LD: ${e.message}`);
    }
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt="/.test(tag)) err(f, `<img> without alt: ${tag.slice(0, 80)}`);
    if (!/\bwidth="/.test(tag) || !/\bheight="/.test(tag)) warn(f, `<img> without width/height: ${tag.slice(0, 80)}`);
  }
  if (!noindex || f === "404.html") {
    for (const m of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)) if (!m[1].startsWith("//") && !resolves(m[1])) err(f, `broken internal link ${m[1]}`);
  }
}
for (const [t, fs_] of titles) if (fs_.length > 1) err(fs_.join(", "), `duplicate title "${t}"`);
for (const [d, fs_] of descs) if (fs_.length > 1) err(fs_.join(", "), `duplicate description "${d.slice(0, 60)}…"`);

// sitemap
if (!fileSet.has("sitemap.xml")) err("sitemap.xml", "missing");
else {
  const xml = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (new Set(locs).size !== locs.length) err("sitemap.xml", "duplicate <loc> entries");
  for (const loc of locs) {
    if (!loc.startsWith(SITE)) { err("sitemap.xml", `foreign URL ${loc}`); continue; }
    const p = loc.slice(SITE.length) || "/";
    if (!resolves(p)) err("sitemap.xml", `${loc} has no file in dist`);
    if (redirects.some(([from, , code]) => from === p && code === "301")) err("sitemap.xml", `${loc} is a redirect`);
  }
  for (const f of indexable) {
    if (["404.html"].includes(f) || f.startsWith("app-shell/") || f.startsWith("careers/") && /campaign|feed/.test(f)) continue;
    if (!locs.includes(SITE + pathOf(f)) && !locs.includes(SITE + pathOf(f) + "/")) warn(f, "indexable page is not in sitemap.xml");
  }
}
// robots + llms
if (!fileSet.has("robots.txt") || !/Sitemap:\s*https:\/\/cintexa\.com\/sitemap\.xml/.test(fs.readFileSync(path.join(dist, "robots.txt"), "utf8"))) err("robots.txt", "missing or does not reference the sitemap");
for (const f of ["llms.txt", "llms-full.txt"]) {
  if (!fileSet.has(f)) { err(f, "missing"); continue; }
  if (f === "llms.txt") for (const m of fs.readFileSync(path.join(dist, f), "utf8").matchAll(/\]\((https:\/\/cintexa\.com[^)]*)\)/g)) if (!resolves(m[1].slice(SITE.length) || "/")) err(f, `link does not resolve: ${m[1]}`);
}
if (!fileSet.has("404.html")) err("404.html", "missing — unknown URLs would not return a real 404");

console.log(`check-seo: ${htmlFiles.length} HTML files, ${indexable.size} indexable`);
for (const w of warns) console.log("  WARN  " + w);
for (const x of errors) console.log("  ERROR " + x);
console.log(`check-seo: ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);

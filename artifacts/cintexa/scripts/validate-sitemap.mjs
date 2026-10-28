/**
 * Validates public/sitemap.xml before it is committed/published. Exit code 1 on any problem, so the daily
 * workflow stops and the last valid sitemap stays in place. Usage: node scripts/validate-sitemap.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://cintexa.com";
const BLOCKED = [/^\/dashboard/, /^\/admin/, /^\/api\//, /^\/sign-in/, /^\/sign-up/];

export function validateSitemap(xml) {
  const problems = [];
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) problems.push("missing XML declaration (UTF-8)");
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') || !xml.trimEnd().endsWith("</urlset>")) problems.push("missing or unclosed <urlset>");
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  if (blocks.length !== (xml.match(/<url>/g) ?? []).length) problems.push("unbalanced <url> elements");
  const seen = new Set();
  for (const b of blocks) {
    const loc = b.match(/<loc>([^<]*)<\/loc>/)?.[1];
    if (!loc) { problems.push("a <url> has no <loc>"); continue; }
    if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(loc)) problems.push(`unescaped & in ${loc}`);
    if (!loc.startsWith(`${ORIGIN}/`)) problems.push(`not on ${ORIGIN} over HTTPS: ${loc}`);
    if (loc.length > 2048) problems.push(`URL too long: ${loc}`);
    if (seen.has(loc)) problems.push(`duplicate: ${loc}`);
    seen.add(loc);
    const p = loc.slice(ORIGIN.length);
    if (p.length > 1 && p.endsWith("/")) problems.push(`trailing slash (non-canonical): ${loc}`);
    if (BLOCKED.some((r) => r.test(p))) problems.push(`private/blocked route in sitemap: ${loc}`);
    const lastmod = b.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1];
    if (lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) problems.push(`bad lastmod "${lastmod}" on ${loc}`);
  }
  if (blocks.length === 0) problems.push("no URLs");
  if (blocks.length > 50000) problems.push("over 50,000 URLs: split into a sitemap index");
  return { problems, urls: [...seen] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/sitemap.xml");
  const { problems, urls } = validateSitemap(fs.readFileSync(file, "utf8"));
  if (problems.length) {
    console.error(`sitemap INVALID (${problems.length} problem(s)):\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(`sitemap OK: ${urls.length} URLs (${new Date().toISOString()})`);
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const source = fs.readFileSync(path.join(appRoot, "src/pages/Blog.tsx"), "utf8");
const slugs = [...source.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]);
const routes = [
  ["/", "1.0"], ["/about", "0.8"], ["/platform", "0.75"],
  ["/solutions/marketing", "0.8"], ["/solutions/sales", "0.8"],
  ["/solutions/ads-boost", "0.7"], ["/solutions/ecommerce", "0.8"],
  ["/solutions/website-development", "0.8"], ["/solutions/software-development", "0.8"],
  ["/blog", "0.9"], ["/case-studies", "0.8"], ["/careers", "0.9"],
  ["/careers/cleaner", "0.8"], ["/contact", "0.7"], ["/get-started", "0.85"],
  ["/privacy-policy", "0.4"], ["/terms", "0.4"], ["/cookie-policy", "0.4"], ["/disclaimer", "0.4"],
  ...slugs.map((slug) => [`/blog/${slug}`, "0.75"])
];
const today = new Date().toISOString().slice(0, 10);
const unique = [...new Map(routes.map(([route, priority]) => [route, priority])).entries()];
const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const body = unique.map(([route, priority]) => `  <url>\n    <loc>${xmlEscape(`https://cintexa.com${route}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${route.startsWith("/blog/") ? "monthly" : route === "/careers" || route === "/blog" ? "weekly" : "monthly"}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
const output = path.join(appRoot, "public/sitemap.xml");
fs.writeFileSync(output, xml, "utf8");
console.log(`Generated ${unique.length} sitemap URLs for ${today}: ${output}`);

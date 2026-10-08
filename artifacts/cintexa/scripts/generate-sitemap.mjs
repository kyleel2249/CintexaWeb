import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const source = fs.readFileSync(path.join(appRoot, "src/pages/Blog.tsx"), "utf8");
const posts = [...source.matchAll(/slug:\s*"([a-z0-9-]+)"[\s\S]*?date:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})"(?:,\s*updated:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})")?/g)]
  .map((match) => ({ slug: match[1], lastmod: match[3] || match[2] }));
const routes = [
  ["/", "1.0"], ["/about", "0.8"],
  ["/solutions/marketing", "0.8"], ["/solutions/sales", "0.8"],
  ["/solutions/ads-boost", "0.7"], ["/solutions/ecommerce", "0.8"],
  ["/solutions/website-development", "0.8"], ["/solutions/software-development", "0.8"],
  ["/blog", "0.9"], ["/case-studies", "0.8"], ["/careers", "0.9"],
  ["/careers/cleaner", "0.8"], ["/contact", "0.7"], ["/get-started", "0.85"],
  ["/privacy-policy", "0.4"], ["/terms", "0.4"], ["/cookie-policy", "0.4"], ["/disclaimer", "0.4"],
  ...posts.map((post) => [`/blog/${post.slug}`, "0.75", post.lastmod])
];
const unique = [...new Map(routes.map((entry) => [entry[0], entry])).values()];
const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const body = unique.map(([route, priority, lastmod]) => {
  const changefreq = route === "/" || route === "/blog" || route === "/careers" ? "weekly" : route.startsWith("/blog/") ? "monthly" : "monthly";
  return `  <url>\n    <loc>${xmlEscape(`https://cintexa.com${route}`)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
const output = path.join(appRoot, "public/sitemap.xml");
fs.writeFileSync(output, xml, "utf8");
console.log(`Generated ${unique.length} sitemap URLs from route and article metadata: ${output}`);

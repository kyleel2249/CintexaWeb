/**
 * Optional: tell IndexNow-enabled search engines (Bing, Yandex, Seznam, Naver…) that URLs changed.
 * Run AFTER the deploy is live (the key file must be reachable):
 *   node scripts/indexnow.mjs /solutions/website-development /sitemap.xml
 * With no arguments it submits every URL in public/sitemap.xml. Google does not use IndexNow
 * (use Search Console). The key is public by design: it is verified by fetching /<key>.txt.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "cintexa.com";
const KEY = fs.readdirSync(path.join(root, "public")).find((f) => /^[a-f0-9]{32}\.txt$/.test(f))?.replace(".txt", "");
if (!KEY) { console.error("indexnow: no <key>.txt file in public/"); process.exit(1); }

const args = process.argv.slice(2);
const urls = args.length
  ? args.map((p) => `https://${HOST}${p.startsWith("/") ? p : `/${p}`}`)
  : [...fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`indexnow: submitted ${urls.length} URL(s) → HTTP ${res.status} ${res.status === 200 || res.status === 202 ? "(accepted)" : "(NOT accepted — check the key file is live)"}`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);

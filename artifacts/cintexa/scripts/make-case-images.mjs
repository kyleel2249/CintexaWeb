/**
 * Generates one branded 1200×630 preview card per case study into public/case-studies/.
 *
 *   npm i --no-save @resvg/resvg-js        (dev-time only; not a project dependency)
 *   npx tsx scripts/make-case-images.mjs
 *
 * File names carry a hash of title|service|status (see caseImagePath), so after editing a case you simply
 * re-run this: the new file appears, the old one is removed, and `npm test` / the build refuse to ship a case
 * whose image is missing or out of date.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CASE_IMAGE_SIZE, CASE_STUDIES, STATUS_LABEL, caseImagePath } from "../src/data/case-studies.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "case-studies");
const { width: W, height: H } = CASE_IMAGE_SIZE;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Greedy word wrap using an average glyph width (good enough for a bold sans at this size). */
export function wrap(text, maxChars, maxLines) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!line) line = word;
    else if ((line + " " + word).length <= maxChars) line += " " + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s,;:.-]*$/, "").slice(0, maxChars - 1) + "…";
    return kept;
  }
  return lines;
}

export function cardSvg(c) {
  const titleLines = wrap(c.title, 24, 3);
  const size = titleLines.length > 2 ? 58 : 66;
  const startY = 250;
  const title = titleLines
    .map((l, i) => `<text x="72" y="${startY + i * (size + 12)}" font-size="${size}" font-weight="700" fill="#FFFFFF">${esc(l)}</text>`)
    .join("");
  const chipY = startY + titleLines.length * (size + 12) + 10;
  const service = c.service;
  const serviceW = 64 + service.length * 15.5;
  const status = STATUS_LABEL[c.status];
  const statusW = 64 + status.length * 12.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B1F3A"/><stop offset="1" stop-color="#123E73"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1080" cy="560" r="330" fill="#35A7FF" fill-opacity="0.12"/>
  <circle cx="1160" cy="80" r="170" fill="#35A7FF" fill-opacity="0.08"/>
  <rect x="72" y="72" width="64" height="6" rx="3" fill="#35A7FF"/>
  <g font-family="DejaVu Sans, Arial, Helvetica, sans-serif">
    <text x="72" y="130" font-size="30" font-weight="700" letter-spacing="6" fill="#FFFFFF">CINTEXA</text>
    <text x="290" y="130" font-size="26" fill="#9FC4E8">Case study</text>
    ${title}
    <rect x="72" y="${chipY}" width="${serviceW}" height="52" rx="26" fill="#35A7FF"/>
    <text x="${72 + serviceW / 2}" y="${chipY + 34}" font-size="24" font-weight="700" fill="#0B1F3A" text-anchor="middle">${esc(service)}</text>
    <rect x="${72 + serviceW + 16}" y="${chipY}" width="${statusW}" height="52" rx="26" fill="none" stroke="#9FC4E8" stroke-width="2"/>
    <text x="${72 + serviceW + 16 + statusW / 2}" y="${chipY + 34}" font-size="22" fill="#DCEBFA" text-anchor="middle">${esc(status)}</text>
    <text x="72" y="${H - 48}" font-size="26" fill="#9FC4E8">cintexa.com/case-studies</text>
  </g>
</svg>`;
}

async function main() {
  let Resvg;
  try {
    ({ Resvg } = await import("@resvg/resvg-js"));
  } catch {
    console.error("Install the renderer first:  npm i --no-save @resvg/resvg-js");
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const keep = new Set();
  for (const c of CASE_STUDIES) {
    const file = path.join(root, "public", caseImagePath(c));
    keep.add(path.basename(file));
    const png = new Resvg(cardSvg(c), { fitTo: { mode: "width", value: W }, font: { loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" } }).render().asPng();
    fs.writeFileSync(file, png);
    console.log("wrote", path.relative(root, file));
  }
  // remove cards left over from earlier versions of a case
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith(".png") && !keep.has(f)) {
      fs.unlinkSync(path.join(outDir, f));
      console.log("removed stale", f);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();

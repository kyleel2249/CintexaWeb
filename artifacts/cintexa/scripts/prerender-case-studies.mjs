/**
 * Post-build prerender for the case-studies section: static HTML for /case-studies and one page per case,
 * so crawlers and link-preview bots (which don't run JavaScript) get the right title, description, preview
 * image, Open Graph / Twitter tags and structured data in the first response.
 *
 * Everything comes from src/data/case-studies.json through the same builders the React pages use
 * (src/data/case-seo.ts). The build fails if a case's preview image is missing, the wrong size, or out of
 * date with the case (its file name carries a hash of what it shows) — run scripts/make-case-images.mjs.
 *
 *   dist/case-studies/index.html
 *   dist/case-studies/<slug>/index.html     one page — and one URL — per case study
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CASE_IMAGE_SIZE, CASE_SECTIONS, STATUS_LABEL, caseImagePath, caseUrlPath, getCaseStudies, readingMinutes } from "../src/data/case-studies.ts";
import { LIST_INTRO, caseListSeo, caseSeo } from "../src/data/case-seo.ts";
import { escapeHtml, injectHead } from "./prerender-careers.mjs";
import { readImageSize } from "./image-info.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const publicDir = path.join(root, "public");

const MAIN_STYLE = "max-width:46rem;margin:2rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;color:#F7F4EE;background:#0B0F14";
const MUTED = "color:rgba(247,244,238,0.75)";

/** Problems with preview images (empty list = fine). */
export function validateCaseImages(cases, baseDir = publicDir) {
  const problems = [];
  for (const c of cases) {
    const rel = caseImagePath(c);
    const file = path.join(baseDir, rel);
    if (!fs.existsSync(file)) {
      problems.push(`${c.slug}: preview image ${rel} is missing — run: npx tsx scripts/make-case-images.mjs`);
      continue;
    }
    const info = readImageSize(fs.readFileSync(file));
    if (!info || info.type !== "image/png") problems.push(`${c.slug}: ${rel} must be a PNG`);
    else if (info.width !== CASE_IMAGE_SIZE.width || info.height !== CASE_IMAGE_SIZE.height) {
      problems.push(`${c.slug}: ${rel} is ${info.width}x${info.height}, expected ${CASE_IMAGE_SIZE.width}x${CASE_IMAGE_SIZE.height}`);
    }
  }
  return problems;
}

function listBody(cases) {
  const items = cases
    .map(
      (c) => `
    <article style="margin:1.25rem 0;padding:1rem;border:1px solid rgba(247,244,238,0.12);border-radius:0.75rem">
      <p style="font-size:0.75rem;${MUTED};margin:0">${escapeHtml(STATUS_LABEL[c.status])} · ${escapeHtml(c.service)} · ${escapeHtml(c.industry)}</p>
      <h2 style="font-size:1.25rem;margin:0.4rem 0"><a href="${caseUrlPath(c)}" style="color:#F7F4EE;text-decoration:none">${escapeHtml(c.title)}</a></h2>
      <p style="${MUTED};font-size:0.9rem">${escapeHtml(c.summary)}</p>
      <p><a href="${caseUrlPath(c)}" style="color:#F5C518">Read case study</a></p>
    </article>`,
    )
    .join("");
  return `
<main id="prerender-case-studies" style="${MAIN_STYLE}">
  <h1 style="font-size:1.85rem">Case studies</h1>
  <p style="${MUTED}">${escapeHtml(LIST_INTRO)}</p>
  ${items}
  <p><a href="/contact" style="color:#F5C518">Contact CINTEXA</a></p>
</main>`;
}

function caseBody(c) {
  const sections = CASE_SECTIONS.map(
    (s) => `<h2 style="font-size:1.15rem;margin-top:1.5rem">${escapeHtml(s.label)}</h2><p style="${MUTED};line-height:1.6">${escapeHtml(c[s.field])}</p>`,
  ).join("");
  const metrics = c.metrics
    .map((m) => `<li><strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.why)} ${escapeHtml(m.how)}</li>`)
    .join("");
  return `
<main id="prerender-case-studies" style="${MAIN_STYLE}">
  <p style="font-size:0.75rem;${MUTED}"><a href="/case-studies" style="color:inherit">Case studies</a> · ${escapeHtml(STATUS_LABEL[c.status])} · ${escapeHtml(c.service)} · ${readingMinutes(c)} min read</p>
  <h1 style="font-size:1.85rem;line-height:1.25">${escapeHtml(c.title)}</h1>
  <p style="${MUTED};line-height:1.6">${escapeHtml(c.summary)}</p>
  ${sections}
  <h2 style="font-size:1.15rem;margin-top:1.5rem">How it would be measured</h2>
  <ul style="${MUTED}">${metrics}</ul>
  <p style="margin-top:1.5rem"><a href="/contact" style="color:#F5C518">Discuss a similar project</a> · <a href="/case-studies" style="color:#F5C518">All case studies</a></p>
</main>`;
}

export function renderCaseListPage(shell, cases) {
  return injectHead(shell, caseListSeo(cases)).replace(/<div id="root"><\/div>/, `<div id="root">${listBody(cases)}</div>`);
}

export function renderCasePage(shell, c) {
  return injectHead(shell, caseSeo(c)).replace(/<div id="root"><\/div>/, `<div id="root">${caseBody(c)}</div>`);
}

function writePage(rel, html) {
  const dir = path.join(dist, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  console.log("prerender:", path.join(rel, "index.html"));
}

function run() {
  const shellPath = path.join(dist, "index.html");
  if (!fs.existsSync(shellPath)) {
    console.error("prerender-case-studies: dist/index.html missing — run vite build first");
    process.exit(1);
  }
  const shell = fs.readFileSync(shellPath, "utf8");
  const cases = getCaseStudies();
  const problems = validateCaseImages(cases);
  if (problems.length) {
    console.error(`prerender-case-studies: preview-image problems:\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  writePage("case-studies", renderCaseListPage(shell, cases));
  for (const c of cases) writePage(path.join("case-studies", c.slug), renderCasePage(shell, c));
  console.log(`prerender-case-studies: done (${cases.length} cases + list)`);
}

if (import.meta.url === `file://${process.argv[1]}`) run();

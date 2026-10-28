/**
 * Post-build prerender for the Web Design & Development service page: static HTML so crawlers and
 * link-preview bots (which may not run JavaScript) get the title, description, canonical, Open Graph
 * tags, JSON-LD AND the real page content (headings, services, FAQs, internal links) in the first response.
 * Everything comes from src/data/web-design.json via the same builders the React page uses.
 *
 *   dist/solutions/website-development/index.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WEB_DESIGN } from "../src/data/web-design.ts";
import { webDesignSeo } from "../src/data/web-design-seo.ts";
import { escapeHtml, injectHead } from "./prerender-careers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const publicDir = path.join(root, "public");

const MAIN_STYLE = "max-width:52rem;margin:2rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;color:#F7F4EE;background:#0B0F14";
const MUTED = "color:rgba(247,244,238,0.75)";
const LINK = "color:#F5C518";

export function renderServicesPage(shell) {
  const c = WEB_DESIGN;
  const e = escapeHtml;
  const services = c.services
    .map(
      (s) => `
  <article id="${e(s.id)}">
    <h3 style="font-size:1.1rem;margin:1.25rem 0 0.25rem">${e(s.title)}</h3>
    <p style="${MUTED}"><strong>The need:</strong> ${e(s.problem)}</p>
    <p style="${MUTED}"><strong>Our solution:</strong> ${e(s.solution)}</p>
    <ul style="${MUTED}">${s.benefits.map((b) => `<li>${e(b)}</li>`).join("")}</ul>
    <p><a href="${e(s.cta.href)}" style="${LINK}">${e(s.cta.label)} →</a></p>
  </article>`,
    )
    .join("");
  const process_ = c.process.map((p) => `<li><strong>${e(p.title)}</strong> — ${e(p.copy)}</li>`).join("");
  const standards = c.standards.map((s) => `<li><strong>${e(s.title)}:</strong> ${e(s.copy)}</li>`).join("");
  const faqs = c.faqs.map((f) => `<h3 style="font-size:1rem;margin:1rem 0 0.25rem">${e(f.q)}</h3><p style="${MUTED}">${e(f.a)}</p>`).join("");
  const related = c.related.map((r) => `<li><a href="${e(r.href)}" style="${LINK}">${e(r.label)}</a> — ${e(r.copy)}</li>`).join("");
  const body = `
<main id="prerender-web-design" style="${MAIN_STYLE}">
  <nav aria-label="Breadcrumb" style="font-size:0.8rem;${MUTED}"><a href="/" style="color:inherit">Home</a> › Web design &amp; development</nav>
  <p style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:#F5C518">${e(c.eyebrow)}</p>
  <h1 style="font-size:2rem;line-height:1.2;margin:0.5rem 0">${e(c.h1)}</h1>
  <p style="font-size:1.15rem;color:#F5C518">${e(c.headline)}</p>
  <p style="line-height:1.6;${MUTED}">${e(c.intro)}</p>
  <p><a href="/contact" style="${LINK}">Request a Website Consultation</a> · <a href="#services" style="${LINK}">Explore Our Services</a> · <a href="/case-studies" style="${LINK}">View Our Work</a></p>
  <h2 id="services" style="font-size:1.4rem;margin-top:2rem">Website design and development services</h2>${services}
  <h2 style="font-size:1.4rem;margin-top:2rem">From discovery to launch and beyond</h2>
  <ol style="${MUTED}">${process_}</ol>
  <h2 style="font-size:1.4rem;margin-top:2rem">Quality standards</h2>
  <ul style="${MUTED}">${standards}</ul>
  <h2 style="font-size:1.4rem;margin-top:2rem">Web design and development questions</h2>${faqs}
  <h2 style="font-size:1.2rem;margin-top:2rem">Related services</h2>
  <ul>${related}</ul>
  <p><a href="/contact" style="${LINK}">Request a Website Consultation</a> · <a href="/get-started" style="${LINK}">Discuss Your Project</a></p>
</main>`;
  const html = injectHead(shell, webDesignSeo());
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${body}</div>`);
}

function run() {
  const shellPath = path.join(dist, "index.html");
  if (!fs.existsSync(shellPath)) {
    console.error("prerender-services: dist/index.html missing — run vite build first");
    process.exit(1);
  }
  if (!fs.existsSync(path.join(publicDir, WEB_DESIGN.image))) {
    console.error(`prerender-services: preview image ${WEB_DESIGN.image} not found in public/`);
    process.exit(1);
  }
  const dir = path.join(dist, WEB_DESIGN.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderServicesPage(fs.readFileSync(shellPath, "utf8")));
  console.log(`prerender-services: ${WEB_DESIGN.path}/index.html`);
}

if (import.meta.url === `file://${process.argv[1]}`) run();

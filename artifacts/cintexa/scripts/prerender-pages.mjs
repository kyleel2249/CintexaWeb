/**
 * Post-build prerender for every static public page, the blog, the 404 page and the neutral app shell, plus
 * llms.txt / llms-full.txt.
 *
 * WHY: the app is a client-rendered SPA. Search crawlers can execute JavaScript, but link-preview bots and most AI
 * crawlers do not, so before this script they received an empty <div id="root"> carrying the HOME page's head for
 * every URL. This writes real HTML — correct <head> (title, description, canonical, Open Graph, Twitter, JSON-LD)
 * AND the page's actual headings, answers, FAQs and links — for each route. React replaces it on load (createRoot),
 * exactly as it already does for /careers and /case-studies.
 *
 * Everything is generated from the same data the React pages render (src/data/*), through the same SEO builders, so
 * HTML, JSON-LD and llms.txt cannot disagree with the visible page.
 *
 *   dist/index.html                       home (the pristine Vite shell is first copied to dist/app-shell/index.html)
 *   dist/<path>/index.html                about, platform, solutions/*, blog, blog/<slug>, contact, get-started, legal
 *   dist/404.html                         served with HTTP 404 by Cloudflare Pages for unknown URLs
 *   dist/app-shell/index.html             noindex shell used by _redirects for client-only routes (dashboard, admin, sign-in/up)
 *   dist/llms.txt, dist/llms-full.txt
 *
 * Run with tsx:  tsx scripts/prerender-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTITY, SERVICES, SITE_URL, abs } from "../src/data/site-entity.ts";
import { STATIC_PAGES, breadcrumbTrail, getStaticPage, notFoundSeo, privateAreaSeo, staticPageSeo } from "../src/data/seo-pages.ts";
import { blogListSeo, blogPostCrumbs, blogPostSeo } from "../src/data/seo-blog.ts";
import { POSTS, postSections, postsNewestFirst, relatedPosts, sectionId, CATEGORY_SERVICE, POST_IMAGE_SIZE } from "../src/data/blog-posts.ts";
import { HOME_ANSWER, HOME_FAQS, PLATFORM_AUTOMATION_STEPS, PLATFORM_HOW_WE_WORK, SOLUTION_CONTENT } from "../src/data/page-content.ts";
import { safeJsonLd } from "../src/data/seo-schema.ts";
import { getCaseStudies } from "../src/data/case-studies.ts";
import { escapeHtml as e, injectHead } from "./prerender-careers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const MAIN = "max-width:52rem;margin:2rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;color:#F7F4EE;background:#0B0F14";
const MUTED = "color:rgba(247,244,238,0.75)";
const LINK = "color:#F5C518";
const H2 = "font-size:1.4rem;margin-top:2rem";
const H3 = "font-size:1.05rem;margin:1rem 0 0.25rem";

const a = (href, text) => `<a href="${e(href)}" style="${LINK}">${e(text)}</a>`;
const ul = (items) => `<ul style="${MUTED}">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const wrap = (id, inner) => `\n<main id="prerender-${id}" style="${MAIN}">${inner}\n</main>`;

function crumbsHtml(trail) {
  const parts = trail.map((c, i) => (i === trail.length - 1 ? `<span aria-current="page">${e(c.name)}</span>` : `<a href="${e(c.path)}" style="color:inherit">${e(c.name)}</a>`));
  return `<nav aria-label="Breadcrumb" style="font-size:0.8rem;${MUTED}">${parts.join(" › ")}</nav>`;
}
const h1 = (t) => `<h1 style="font-size:2rem;line-height:1.2;margin:0.75rem 0">${e(t)}</h1>`;
const answerHtml = (id, q, ans) => `<section aria-labelledby="${id}-q"><h2 id="${id}-q" style="${H2}">${e(q)}</h2><p style="line-height:1.6;${MUTED}">${e(ans)}</p></section>`;
const faqHtml = (title, faqs) =>
  faqs.length ? `<h2 style="${H2}">${e(title)}</h2>${faqs.map((f) => `<h3 style="${H3}">${e(f.q)}</h3><p style="${MUTED}">${e(f.a)}</p>`).join("")}` : "";
const relatedHtml = (links) => (links.length ? `<h2 style="${H2}">Related services</h2>${ul(links.map((r) => `${a(r.href, r.label)} — ${e(r.copy)}`))}` : "");
const articlesHtml = (list) => (list.length ? `<h2 style="${H2}">Learn more</h2>${ul(list.map((x) => a(`/blog/${x.slug}`, x.title)))}` : "");
const ctaHtml = (label) => `<p>${a("/contact", label ?? "Contact CINTEXA")} · ${a("/get-started", "Get started")}</p>`;
const servicesHtml = () => ul(SERVICES.map((s) => `${a(s.path, s.name)} — ${e(s.summary)}`));

// ---------------------------------------------------------------------------------------------------------------
// Page bodies
// ---------------------------------------------------------------------------------------------------------------

function homeBody(page) {
  const latest = postsNewestFirst().slice(0, 3);
  return wrap(
    "home",
    `${h1(page.h1)}
  <p style="font-size:1.1rem;line-height:1.6;${MUTED}">${e(ENTITY.definition)}</p>
  <p>${a("/get-started", "Get started")} · ${a("/platform", "Explore solutions")} · ${a("/contact", "Contact us")}</p>
  ${answerHtml("home", HOME_ANSWER.question, HOME_ANSWER.answer)}
  <h2 style="${H2}">What CINTEXA provides</h2>${servicesHtml()}
  <h2 style="${H2}">Latest articles</h2>${ul(latest.map((p) => `${a(`/blog/${p.slug}`, p.title)} — ${e(p.excerpt)}`))}
  <p>${a("/blog", "All articles")} · ${a("/case-studies", "Case studies")} · ${a("/careers", "Careers")} · ${a("/about", "About CINTEXA")}</p>
  ${faqHtml("Questions about CINTEXA", HOME_FAQS)}`,
  );
}

function aboutBody(page) {
  return wrap(
    "about",
    `${crumbsHtml(breadcrumbTrail(page))}${h1(page.h1)}
  <p style="line-height:1.6;${MUTED}">${e(ENTITY.definition)}</p>
  <h2 style="${H2}">CINTEXA at a glance</h2>
  <h3 style="${H3}">Services</h3>${servicesHtml()}
  <h3 style="${H3}">Where we work</h3><p style="${MUTED}">Online, serving businesses in ${e(ENTITY.areaServed)} and beyond. CINTEXA operates digitally; no public office address is published.</p>
  <h3 style="${H3}">Contact</h3><p style="${MUTED}"><a href="mailto:${e(ENTITY.email)}" style="${LINK}">${e(ENTITY.email)}</a> · <a href="tel:${e(ENTITY.phone)}" style="${LINK}">${e(ENTITY.phoneDisplay)}</a> · ${a(ENTITY.whatsapp, "WhatsApp")}</p>
  <h3 style="${H3}">Official profiles</h3>${ul(ENTITY.sameAs.map((u) => a(u, new URL(u).hostname.replace(/^(www|web)\./, ""))))}
  <p>${a("/get-started", "Discuss a project")} · ${a("/platform", "All solutions")}</p>`,
  );
}

function platformBody(page) {
  const c = SOLUTION_CONTENT.platform;
  return wrap(
    "platform",
    `${crumbsHtml(breadcrumbTrail(page))}${h1(page.h1)}
  ${answerHtml("platform", c.question, c.answer)}
  <h2 style="${H2}">Our solutions</h2>${servicesHtml()}
  <h2 style="${H2}">How business automation works</h2>
  <ol style="${MUTED}">${PLATFORM_AUTOMATION_STEPS.map((s) => `<li><strong>${e(s.title)}</strong> — ${e(s.copy)}</li>`).join("")}</ol>
  <h2 style="${H2}">Who CINTEXA helps</h2>${ul(c.audience.map(e))}
  <h2 style="${H2}">Problems we address</h2>${ul(c.problems.map(e))}
  <h2 style="${H2}">How we work</h2>
  <ol style="${MUTED}">${PLATFORM_HOW_WE_WORK.map((s) => `<li><strong>${e(s.title)}</strong> — ${e(s.copy)}</li>`).join("")}</ol>
  ${faqHtml("Questions about CINTEXA's services", c.faqs)}${articlesHtml(c.articles)}${ctaHtml(c.ctaLabel)}`,
  );
}

function solutionBody(page) {
  const id = SERVICES.find((s) => s.path === page.path).id;
  const c = SOLUTION_CONTENT[id];
  return wrap(
    id,
    `${crumbsHtml(breadcrumbTrail(page))}${h1(page.h1)}
  <p style="line-height:1.6;${MUTED}">${e(SERVICES.find((s) => s.id === id).summary)}</p>
  ${answerHtml(id, c.question, c.answer)}
  <h2 style="${H2}">Who it is for</h2>${ul(c.audience.map(e))}
  <h2 style="${H2}">Problems it addresses</h2>${ul(c.problems.map(e))}
  ${faqHtml(`${page.socialTitle.split(" — ")[0]}: common questions`, c.faqs)}${articlesHtml(c.articles)}${relatedHtml(c.related)}${ctaHtml(c.ctaLabel)}`,
  );
}

function blogListBody(page) {
  return wrap(
    "blog",
    `${crumbsHtml(breadcrumbTrail(page))}${h1(page.h1)}
  <p style="line-height:1.6;${MUTED}">Original, practical guidance on software development, business automation, website development, SEO, e-commerce, digital marketing, CRM, cybersecurity, productivity, analytics and technology for businesses in Ghana and across Africa.</p>
  ${postsNewestFirst()
    .map(
      (p) => `<article><h2 style="font-size:1.2rem;margin:1.5rem 0 0.25rem">${a(`/blog/${p.slug}`, p.title)}</h2><p style="font-size:0.8rem;${MUTED}">${e(p.category)} · ${e(p.readTime)} read · <time datetime="${e(p.date)}">${e(p.date)}</time></p><p style="${MUTED}">${e(p.excerpt)}</p></article>`,
    )
    .join("")}
  ${ctaHtml("Contact CINTEXA")}`,
  );
}

function blogPostBody(post) {
  const sections = postSections(post);
  const servicePath = CATEGORY_SERVICE[post.category] ?? "/platform";
  const svc = SERVICES.find((s) => s.path === servicePath);
  return wrap(
    `post-${post.slug}`,
    `${crumbsHtml(blogPostCrumbs(post))}
  <p style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:#F5C518">${e(post.category)} · ${e(post.readTime)} read</p>
  ${h1(post.title)}
  <p style="font-size:1.1rem;${MUTED}">${e(post.excerpt)}</p>
  <p style="font-size:0.85rem;${MUTED}">Author: ${a("/about", "CINTEXA Editorial Team")} · <time datetime="${e(post.date)}">Published ${e(post.date)}</time>${post.updated ? ` · <time datetime="${e(post.updated)}">Updated ${e(post.updated)}</time>` : ""}</p>
  <img src="${e(post.image)}" alt="${e(post.imageAlt)}" width="${POST_IMAGE_SIZE.width}" height="${POST_IMAGE_SIZE.height}" style="max-width:100%;height:auto;border-radius:1rem;margin:1rem 0" />
  <p style="line-height:1.7">${e(post.intro)}</p>
  ${sections.length >= 4 ? `<nav aria-label="Table of contents"><p><strong>In this article</strong></p><ol style="${MUTED}">${sections.map((s) => `<li><a href="#${sectionId(s.heading)}" style="${LINK}">${e(s.heading)}</a></li>`).join("")}</ol></nav>` : ""}
  ${sections
    .map(
      (s) => `<section id="${sectionId(s.heading)}"><h2 style="${H2}">${e(s.heading)}</h2>${s.paragraphs.map((p) => `<p style="line-height:1.7;${MUTED}">${e(p)}</p>`).join("")}${s.bullets ? ul(s.bullets.map(e)) : ""}</section>`,
    )
    .join("")}
  <h2 style="${H2}">Sources and further reading</h2>${ul(post.references.map((r) => `<a href="${e(r.url)}" rel="noopener noreferrer" style="${LINK}">${e(r.label)}</a>`))}
  <p style="font-size:0.85rem;${MUTED}">This article is general educational information, not legal, financial or cybersecurity advice for a specific situation.</p>
  <h2 style="${H2}">How CINTEXA can help</h2><p style="${MUTED}">Read about our ${a(servicePath, (svc?.name ?? "CINTEXA solutions").toLowerCase())} or see ${a("/platform", "all CINTEXA solutions")}.</p>
  <h2 style="${H2}">Related articles</h2>${ul(relatedPosts(post, 3).map((r) => a(`/blog/${r.slug}`, r.title)))}
  ${ctaHtml("Contact CINTEXA")}`,
  );
}

function contactBody(page) {
  return wrap(
    "contact",
    `${crumbsHtml(breadcrumbTrail(page))}${h1(page.h1)}
  <p style="line-height:1.6;${MUTED}">Contact CINTEXA about website development, custom software, automation, e-commerce and digital business support. We work with businesses and project teams in Ghana and beyond.</p>
  ${ul([`Email: <a href="mailto:${e(ENTITY.email)}" style="${LINK}">${e(ENTITY.email)}</a>`, `Phone: <a href="tel:${e(ENTITY.phone)}" style="${LINK}">${e(ENTITY.phoneDisplay)}</a>`, `WhatsApp: ${a(ENTITY.whatsapp, ENTITY.phoneDisplay)}`])}
  <p style="${MUTED}">The enquiry form needs JavaScript. Without it, email or call us using the details above.</p>
  <p>${a("/platform", "Our solutions")} · ${a("/solutions/website-development", "Web design & development")} · ${a("/get-started", "Get started")}</p>`,
  );
}

function getStartedBody(page) {
  return wrap(
    "get-started",
    `${crumbsHtml(breadcrumbTrail(page))}${h1(page.h1)}
  <p style="line-height:1.6;${MUTED}">${e(page.description)} Creating an account needs JavaScript; to talk to the team directly, use the contact details below.</p>
  <p>${a("/contact", "Contact CINTEXA")} · ${a("/platform", "Explore our solutions")}</p>`,
  );
}

function legalBody(page) {
  const others = STATIC_PAGES.filter((p) => ["/privacy-policy", "/terms", "/cookie-policy", "/disclaimer"].includes(p.path) && p.path !== page.path);
  return wrap(
    `legal-${page.path.slice(1)}`,
    `${crumbsHtml(breadcrumbTrail(page))}${h1(page.h1)}
  <p style="line-height:1.6;${MUTED}">${e(page.description)}</p>
  <p style="${MUTED}">Questions? Email <a href="mailto:${e(ENTITY.email)}" style="${LINK}">${e(ENTITY.email)}</a>.</p>
  <p>${others.map((p) => a(p.path, p.h1)).join(" · ")} · ${a("/contact", "Contact")}</p>`,
  );
}

function notFoundBody() {
  return wrap(
    "404",
    `${h1("This page doesn't exist.")}
  <p style="${MUTED}">Check the address, or choose where to go next.</p>
  <p>${a("/", "Back to home")} · ${a("/platform", "Browse our solutions")} · ${a("/blog", "Read the blog")} · ${a("/contact", "Contact CINTEXA")}</p>`,
  );
}

function bodyFor(page) {
  if (page.path === "/") return homeBody(page);
  if (page.path === "/about") return aboutBody(page);
  if (page.path === "/platform") return platformBody(page);
  if (page.path === "/blog") return blogListBody(page);
  if (page.path === "/contact") return contactBody(page);
  if (page.path === "/get-started") return getStartedBody(page);
  if (page.service) return solutionBody(page);
  return legalBody(page);
}

// ---------------------------------------------------------------------------------------------------------------
// llms.txt
// ---------------------------------------------------------------------------------------------------------------

export function renderLlmsTxt() {
  const cases = getCaseStudies();
  const L = [];
  L.push(`# ${ENTITY.name}`, "", `> ${ENTITY.definition}`, "");
  L.push(ENTITY.description, "");
  L.push("CINTEXA operates digitally and serves businesses in Ghana and beyond. No public office address is published. Case studies are labelled illustrative unless a client has approved a verified one; no results are claimed that are not evidenced.", "");
  L.push("## Services");
  for (const s of SERVICES) L.push(`- [${s.name}](${abs(s.path)}): ${s.summary}`);
  L.push(`- [All solutions and business automation](${abs("/platform")}): overview of every service and how business automation works.`, "");
  L.push("## Key pages");
  L.push(`- [About CINTEXA](${abs("/about")}): who CINTEXA is, what it builds and how it works.`);
  L.push(`- [Contact](${abs("/contact")}): email ${ENTITY.email}, phone ${ENTITY.phoneDisplay}, WhatsApp.`);
  L.push(`- [Get started](${abs("/get-started")}): create an account or begin a project conversation.`);
  L.push(`- [Case studies](${abs("/case-studies")}): worked examples of how projects are assessed, built and measured.`);
  L.push(`- [Careers](${abs("/careers")}): current vacancies and job alerts.`, "");
  L.push("## Articles");
  for (const p of postsNewestFirst()) L.push(`- [${p.title}](${abs(`/blog/${p.slug}`)}): ${p.excerpt}`);
  L.push("");
  if (cases.length) {
    L.push("## Case studies");
    for (const c of cases) L.push(`- [${c.title}](${abs(`/case-studies/${c.slug}`)}): ${c.summary}`);
    L.push("");
  }
  L.push("## Contact", `- Email: ${ENTITY.email}`, `- Phone / WhatsApp: ${ENTITY.phoneDisplay}`, ...ENTITY.sameAs.map((u) => `- Official profile: ${u}`), "");
  L.push("## Optional");
  for (const p of STATIC_PAGES.filter((x) => ["/privacy-policy", "/terms", "/cookie-policy", "/disclaimer"].includes(x.path))) L.push(`- [${p.h1}](${abs(p.path)})`);
  L.push(`- [Full text of this summary's key pages](${abs("/llms-full.txt")})`, "");
  return L.join("\n");
}

export function renderLlmsFullTxt() {
  const L = [`# ${ENTITY.name} — full text of key pages`, "", `Source: ${SITE_URL}. Generated at build time from the same content as the website.`, ""];
  L.push(`## What is CINTEXA?`, HOME_ANSWER.answer, "", ...HOME_FAQS.flatMap((f) => [`### ${f.q}`, f.a, ""]));
  for (const id of ["platform", ...SERVICES.map((s) => s.id)]) {
    const c = SOLUTION_CONTENT[id];
    if (!c || (!c.faqs.length && id === "website-development")) continue;
    const svc = SERVICES.find((s) => s.id === id);
    L.push(`## ${svc ? svc.name : "CINTEXA solutions"} (${abs(svc ? svc.path : "/platform")})`, `### ${c.question}`, c.answer, "");
    if (c.audience.length) L.push("### Who it is for", ...c.audience.map((x) => `- ${x}`), "");
    if (c.problems.length) L.push("### Problems it addresses", ...c.problems.map((x) => `- ${x}`), "");
    for (const f of c.faqs) L.push(`### ${f.q}`, f.a, "");
  }
  L.push("## Articles", "");
  for (const p of postsNewestFirst()) {
    L.push(`### ${p.title}`, `URL: ${abs(`/blog/${p.slug}`)} · Published ${p.date}${p.updated ? ` · Updated ${p.updated}` : ""}`, "", p.intro, "");
    for (const s of postSections(p)) L.push(`#### ${s.heading}`, ...s.paragraphs, ...(s.bullets ?? []).map((b) => `- ${b}`), "");
  }
  return L.join("\n");
}

// ---------------------------------------------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------------------------------------------

const withBody = (html, body) => html.replace(/<div id="root"><\/div>/, `<div id="root">${body}</div>`);
const HERO_PRELOAD = '<link rel="preload" as="image" href="/images/carousel/01-challenge.webp" type="image/webp" fetchpriority="high" />';

/**
 * Returns { "<relative file path>": html } for every page this script owns. `shell` is the pristine Vite index.html.
 * Pure (no file access) so tests can call it with a tiny shell.
 */
export function renderPages(shell) {
  if (!/<div id="root"><\/div>/.test(shell)) throw new Error('prerender-pages: shell has no empty <div id="root"></div> (is dist/index.html already prerendered?)');
  const files = {};
  for (const page of STATIC_PAGES) {
    const seo = page.path === "/blog" ? blogListSeo() : staticPageSeo(page.path);
    const html = withBody(injectHead(shell, seo, page.path === "/" ? HERO_PRELOAD : ""), bodyFor(page));
    files[page.path === "/" ? "index.html" : `${page.path.slice(1)}/index.html`] = html;
  }
  for (const post of POSTS) files[`blog/${post.slug}/index.html`] = withBody(injectHead(shell, blogPostSeo(post)), blogPostBody(post));
  // noindex pages must not declare the home page as their canonical (that would be a soft duplicate signal).
  const noCanonical = (h) => h.replace(/<link rel="canonical"[^>]*>\s*/g, "").replace(/<meta property="og:url"[^>]*>\s*/g, "");
  files["404.html"] = noCanonical(withBody(injectHead(shell, notFoundSeo()), notFoundBody()));
  files["app-shell/index.html"] = noCanonical(injectHead(shell, privateAreaSeo()));
  files["llms.txt"] = renderLlmsTxt();
  files["llms-full.txt"] = renderLlmsFullTxt();
  return files;
}

function run() {
  const shellPath = path.join(dist, "index.html");
  if (!fs.existsSync(shellPath)) {
    console.error("prerender-pages: dist/index.html missing — run vite build first");
    process.exit(1);
  }
  const files = renderPages(fs.readFileSync(shellPath, "utf8"));
  // Write the home page last so every other page above was built from the pristine shell.
  const order = Object.keys(files).sort((x, y) => (x === "index.html" ? 1 : y === "index.html" ? -1 : 0));
  for (const rel of order) {
    const out = path.join(dist, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, files[rel]);
  }
  console.log(`prerender-pages: wrote ${order.length} files (${STATIC_PAGES.length} pages, ${POSTS.length} articles, 404, app-shell, llms.txt, llms-full.txt)`);
}

// `safeJsonLd` and `getStaticPage` are re-exported for tests that want to assert on the same helpers the build uses.
export { safeJsonLd, getStaticPage };

if (import.meta.url === `file://${process.argv[1]}`) run();

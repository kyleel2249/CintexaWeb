/**
 * Post-build prerender for public career routes.
 *
 * Writes static HTML under dist/ so crawlers AND link-preview bots (WhatsApp, Facebook, X,
 * LinkedIn, Slack…) — which do not run JavaScript — receive the right title, description,
 * preview image, Open Graph / Twitter tags and JobPosting JSON-LD in the first response.
 *
 * Nothing is hard-coded per job: every page is generated from src/data/jobs.json through the same
 * builders (src/data/careers-seo.ts) the React pages use, so adding or editing a vacancy in
 * jobs.json updates its page, the /careers preview, JSON-LD and sitemap on the next build.
 *
 * Run with tsx (it imports the TypeScript data layer):  tsx scripts/prerender-careers.mjs
 *
 * Output (Cloudflare Pages outDir = artifacts/cintexa/dist):
 *   dist/careers/index.html
 *   dist/careers/<slug>/index.html      (one page — and one URL — per vacancy)
 *   dist/careers/feed.xml               (RSS 2.0 of open vacancies)
 *   dist/careers/jobs.json              (the same, as public JSON)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getOpenJobs, jobWhatsAppUrl, employmentLabel } from "../src/data/jobs.ts";
import { CAMPAIGNS } from "../src/data/campaigns.ts";
import { campaignSeo } from "../src/data/campaigns-seo.ts";
import { isCampaignOpen, roleMailto, mailtoUrl } from "../src/data/campaigns.ts";
import { jobSeo, careersListSeo, jobCanonical, absoluteUrl, SITE_URL } from "../src/data/careers-seo.ts";
import { readImageSize } from "./image-info.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const publicDir = path.join(root, "public");

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** JSON inside <script> must not be able to close the tag. */
function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * Fail the build when a job's preview image is missing, not a raster, or its declared size is
 * wrong — a wrong og:image:width/height or an SVG preview silently breaks link previews.
 */
export function validateJobImages(jobs, baseDir = publicDir) {
  const problems = [];
  for (const job of jobs) {
    const file = path.join(baseDir, job.socialImage);
    if (!fs.existsSync(file)) {
      problems.push(`${job.slug}: socialImage ${job.socialImage} not found in public/`);
      continue;
    }
    const info = readImageSize(fs.readFileSync(file));
    if (!info) {
      problems.push(`${job.slug}: socialImage ${job.socialImage} must be a JPEG, PNG, WebP or GIF (SVG is not valid for link previews)`);
    } else if (info.width !== job.socialImageWidth || info.height !== job.socialImageHeight) {
      problems.push(
        `${job.slug}: socialImage is ${info.width}x${info.height} but jobs.json declares ${job.socialImageWidth}x${job.socialImageHeight}`,
      );
    }
    if (!fs.existsSync(path.join(baseDir, job.image))) {
      problems.push(`${job.slug}: image ${job.image} not found in public/`);
    }
  }
  return problems;
}

/** Replaces all inherited head metadata in the Vite shell with this page's values. */
export function injectHead(template, seo, extraHead = "") {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);

  // Remove homepage defaults so crawlers never see two og:image tags or a wrong canonical.
  html = html
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:[^"']+["'])[^>]*\/?\s*>/gi, "")
    .replace(/<meta\b(?=[^>]*\bname=["']twitter:[^"']+["'])[^>]*\/?\s*>/gi, "")
    .replace(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\/?\s*>/gi, "")
    .replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*\/?\s*>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\/?\s*>/gi, "")
    .replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, "");

  const img = escapeHtml(seo.image);
  const lines = [
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="${escapeHtml(seo.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
    `<meta property="og:type" content="${seo.ogType}" />`,
    '<meta property="og:site_name" content="CINTEXA" />',
    `<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.socialTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:secure_url" content="${img}" />`,
    seo.imageType ? `<meta property="og:image:type" content="${seo.imageType}" />` : "",
    seo.imageWidth ? `<meta property="og:image:width" content="${seo.imageWidth}" />` : "",
    seo.imageHeight ? `<meta property="og:image:height" content="${seo.imageHeight}" />` : "",
    `<meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}" />`,
    `<meta name="twitter:card" content="${seo.twitterCard}" />`,
    `<meta name="twitter:title" content="${escapeHtml(seo.socialTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}" />`,
    seo.jsonLd ? `<script type="application/ld+json" data-seo="page">${safeJson(seo.jsonLd)}</script>` : "",
    extraHead,
  ]
    .filter(Boolean)
    .join("\n    ");
  return html.replace("</head>", `    ${lines}\n  </head>`);
}

const MAIN_STYLE =
  "max-width:42rem;margin:2rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;color:#F7F4EE;background:#0B0F14";

function jobBody(job) {
  const reqs = job.requirements.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  const duties = job.responsibilities.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  return `
<main id="prerender-careers" style="${MAIN_STYLE}">
  <p style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:#F5C518">Careers · Open role</p>
  <h1 style="font-size:1.85rem;line-height:1.25;margin:0.5rem 0 0">${escapeHtml(job.title)}</h1>
  <p style="color:rgba(247,244,238,0.7);font-size:0.9rem">Title / Role: <strong style="color:#F7F4EE">${escapeHtml(job.role)}</strong>${job.employerName ? ` · ${escapeHtml(job.employerName)}` : ""} · ${escapeHtml(job.location)} · ${escapeHtml(employmentLabel(job))}</p>
  <img src="${escapeHtml(job.image)}" alt="${escapeHtml(job.imageAlt || `${job.role} job vacancy`)}" width="${job.socialImageWidth}" height="${job.socialImageHeight}" style="max-width:100%;height:auto;border-radius:1rem;margin:1.5rem 0" />
  <p style="line-height:1.6">${escapeHtml(job.summary)}</p>
  <p style="line-height:1.6;color:rgba(247,244,238,0.75)">${escapeHtml(job.description)}</p>
  ${duties ? `<h2 style="font-size:1.15rem;margin-top:1.5rem">What you’ll do</h2>\n  <ul style="color:rgba(247,244,238,0.75)">${duties}</ul>` : ""}
  <h2 style="font-size:1.15rem;margin-top:1.5rem">Requirements</h2>
  <ul style="color:rgba(247,244,238,0.75)">${reqs}</ul>
  <p style="margin-top:1.5rem"><strong>Apply now:</strong>
    <a href="tel:${escapeHtml(job.applyPhone)}" style="color:#F5C518">Call ${escapeHtml(job.applyPhoneDisplay)}</a>
    ${jobWhatsAppUrl(job) ? `·
    <a href="${escapeHtml(jobWhatsAppUrl(job))}" style="color:#F5C518">WhatsApp ${escapeHtml(job.applyPhoneDisplay)}</a>` : ""}
  </p>
  <p style="font-size:0.8rem;color:rgba(247,244,238,0.55);margin-top:2rem"><a href="/careers" style="color:inherit">All careers</a></p>
</main>`;
}

function listBody(jobs, campaigns = CAMPAIGNS) {
  const campaignItems = campaigns
    .map(
      (c) => `
    <article style="margin:1.25rem 0;padding:1rem;border:1px solid rgba(247,244,238,0.12);border-radius:0.75rem">
      <h2 style="font-size:1.25rem;margin:0"><a href="/careers/${escapeHtml(c.slug)}" style="color:#F7F4EE;text-decoration:none">${escapeHtml(c.employerName)} — ${escapeHtml(c.badge)}</a></h2>
      <p style="color:rgba(247,244,238,0.7);font-size:0.9rem">${c.roles.length} vacancies · ${isCampaignOpen(c) ? "Deadline" : "Closed"}: ${escapeHtml(c.deadlineLabel)}</p>
      <p style="color:rgba(247,244,238,0.75);font-size:0.9rem">${escapeHtml(c.roles.map((r) => r.title).join(", "))}</p>
      <p><a href="/careers/${escapeHtml(c.slug)}" style="color:#F5C518">View positions &amp; apply</a></p>
    </article>`,
    )
    .join("");
  const items = jobs
    .map(
      (j) => `
    <article style="margin:1.25rem 0;padding:1rem;border:1px solid rgba(247,244,238,0.12);border-radius:0.75rem">
      <h2 style="font-size:1.25rem;margin:0"><a href="/careers/${escapeHtml(j.slug)}" style="color:#F7F4EE;text-decoration:none">${escapeHtml(j.title)}</a></h2>
      <p style="color:rgba(247,244,238,0.7);font-size:0.9rem">Role: ${escapeHtml(j.role)}${j.employerName ? ` · ${escapeHtml(j.employerName)}` : ""} · ${escapeHtml(j.location)}</p>
      <p style="color:rgba(247,244,238,0.75);font-size:0.9rem">${escapeHtml(j.summary)}</p>
      <p><a href="/careers/${escapeHtml(j.slug)}" style="color:#F5C518">View role &amp; apply</a></p>
    </article>`,
    )
    .join("");
  return `
<main id="prerender-careers" style="${MAIN_STYLE}">
  <h1 style="font-size:1.85rem">Careers &amp; job vacancies in Ghana</h1>
  <p style="color:rgba(247,244,238,0.75)">Open roles and application details. Call or WhatsApp listed contacts to apply.</p>
  ${campaignItems}${items}
</main>`;
}


function campaignBody(c, now = new Date()) {
  const open = isCampaignOpen(c, now);
  const roles = c.roles
    .map(
      (r) => `<li>${escapeHtml(r.title)}${open ? ` — <a href="${escapeHtml(roleMailto(c, r))}" style="color:#F5C518">Apply Now!</a>` : ""}</li>`,
    )
    .join("");
  return `
<main id="prerender-careers" style="${MAIN_STYLE}">
  <p style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:#F5C518">${escapeHtml(c.badge)}</p>
  <h1 style="font-size:1.85rem;line-height:1.25;margin:0.5rem 0 0">${escapeHtml(c.headline)}</h1>
  <p style="font-size:1.1rem"><strong>${escapeHtml(c.subheadline)}</strong></p>
  <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.imageAlt)}" width="${c.imageWidth}" height="${c.imageHeight}" style="max-width:100%;height:auto;border-radius:1rem;margin:1.5rem 0" />
  <p style="line-height:1.6">${escapeHtml(c.openingCopy)}</p>
  <p><strong>${open ? "Application Deadline" : "Applications closed"}: ${escapeHtml(c.deadlineLabel)}</strong></p>
  <h2 style="font-size:1.15rem;margin-top:1.5rem">Open positions</h2>
  <ol>${roles}</ol>
  <h2 style="font-size:1.15rem;margin-top:1.5rem">How to Apply</h2>
  <p style="line-height:1.6">${escapeHtml(c.applyInstructions)}</p>
  <p><a href="${escapeHtml(mailtoUrl(c.applyEmail))}" style="color:#F5C518">${escapeHtml(c.applyEmail)}</a></p>
  <p style="font-size:0.8rem;color:rgba(247,244,238,0.55);margin-top:2rem"><a href="/careers" style="color:inherit">All careers</a></p>
</main>`;
}

export function renderCampaignPage(shell, campaign, now = new Date()) {
  const html = injectHead(shell, campaignSeo(campaign, now));
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${campaignBody(campaign, now)}</div>`);
}

const FEED_LINK = '<link rel="alternate" type="application/rss+xml" title="CINTEXA job vacancies" href="/careers/feed.xml" />';

export function renderListPage(shell, jobs) {
  const html = injectHead(shell, careersListSeo(jobs), FEED_LINK);
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${listBody(jobs)}</div>`);
}

export function renderJobPage(shell, job) {
  const html = injectHead(shell, jobSeo(job));
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${jobBody(job)}</div>`);
}

const xmlEscape = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const postedAt = (job) => new Date(`${job.datePosted}T09:00:00Z`);

/** RSS 2.0 feed of open vacancies. Deterministic: dates come from the data, not the build clock. */
export function buildFeedXml(jobs) {
  const newest = jobs.length ? postedAt(jobs[0]) : new Date(0);
  const items = jobs
    .map((j) => {
      const url = jobCanonical(j);
      return `    <item>
      <title>${xmlEscape(j.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${postedAt(j).toUTCString()}</pubDate>${j.category ? `\n      <category>${xmlEscape(j.category)}</category>` : ""}
      <description>${xmlEscape(j.summary)}</description>
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CINTEXA Careers — job vacancies in Ghana</title>
    <link>${SITE_URL}/careers</link>
    <description>Open job vacancies posted on CINTEXA Careers.</description>
    <language>en</language>
    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/careers/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

/** The same vacancies as plain JSON for aggregators and partners. */
export function buildJobsJson(jobs) {
  return {
    site: SITE_URL,
    count: jobs.length,
    jobs: jobs.map((j) => ({
      id: j.id,
      slug: j.slug,
      url: jobCanonical(j),
      title: j.title,
      role: j.role,
      employer: j.employerName ?? null,
      category: j.category ?? null,
      location: j.location,
      employmentType: j.employmentType,
      datePosted: j.datePosted,
      validThrough: j.validThrough ?? null,
      summary: j.summary,
      image: absoluteUrl(j.socialImage),
    })),
  };
}

function writePage(relDir, html) {
  const dir = path.join(dist, relDir);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "index.html");
  fs.writeFileSync(dest, html);
  console.log("prerender:", path.relative(dist, dest));
}

function run() {
  const shellPath = path.join(dist, "index.html");
  if (!fs.existsSync(shellPath)) {
    console.error("prerender: dist/index.html missing — run vite build first");
    process.exit(1);
  }
  const shell = fs.readFileSync(shellPath, "utf8");
  const open = getOpenJobs(); // current vacancies, newest first

  const problems = validateJobImages(open);
  if (problems.length) {
    console.error(`prerender: preview-image problems in src/data/jobs.json:\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }

  writePage("careers", renderListPage(shell, open));
  for (const job of open) {
    writePage(path.join("careers", job.slug), renderJobPage(shell, job));
  }
  for (const c of CAMPAIGNS) {
    writePage(path.join("careers", c.slug), renderCampaignPage(shell, c));
    if (!fs.existsSync(path.join(publicDir, c.image))) {
      console.error(`prerender: campaign ${c.slug}: image ${c.image} not found in public/`);
      process.exit(1);
    }
  }
  fs.writeFileSync(path.join(dist, "careers", "feed.xml"), buildFeedXml(open));
  fs.writeFileSync(path.join(dist, "careers", "jobs.json"), `${JSON.stringify(buildJobsJson(open), null, 2)}\n`);
  console.log("prerender: careers/feed.xml, careers/jobs.json");
  console.log(`prerender: done (${open.length} jobs + list)`);
}

// Only run when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

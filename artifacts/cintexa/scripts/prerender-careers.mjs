/**
 * Post-build prerender for public career routes.
 * Writes static HTML under dist/ so crawlers receive titles, descriptions,
 * JobPosting JSON-LD, and visible copy in the first response — without
 * running the full React tree (Clerk / WebGL) on the server.
 *
 * Output (Cloudflare Pages outDir = artifacts/cintexa/dist):
 *   dist/careers/index.html
 *   dist/careers/<slug>/index.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

/** Mirrors src/data/jobs.ts — keep in sync when adding roles */
const JOBS = [
  {
    id: "cleaner-ghana",
    slug: "cleaner",
    title: "Cleaners Job Vacancy in Ghana — Apply Now",
    role: "Cleaners",
    employmentType: "FULL_TIME",
    location: "Ghana",
    requirements: ["Available and dedicated", "Punctual", "High cleaning standards"],
    responsibilities: [
      "Clean and maintain homes, offices, churches, schools, and other assigned premises",
      "Daily cleaning of rooms, halls, restrooms, kitchens, and common areas",
      "Restock cleaning and hygiene supplies",
      "Report maintenance or safety needs promptly",
      "Leave every space clean, safe, and welcoming",
    ],
    addressCountry: "GH",
    validThrough: "2026-12-31",
    occupationalCategory: "37-2011.00",
    summary:
      "Cleaners job vacancy in Ghana. Apply now — available and dedicated candidates welcome for homes, offices, churches and more. Call or WhatsApp +233 59 516 8610.",
    description:
      "We are recruiting Cleaners to keep homes, offices, churches, schools and other premises clean, safe and welcoming. Duties include routine cleaning of rooms, halls, restrooms, kitchens and shared areas; restocking supplies; and reporting maintenance needs. Ideal for people who are available and dedicated, punctual, and proud of high standards across residential and community settings—not only professional offices.",
    image: "/careers/cleaner-job-vacancy.jpeg",
    applyPhone: "+233595168610",
    applyPhoneDisplay: "+233 59 516 8610",
    applyWhatsApp: "233595168610",
    datePosted: "2026-09-21",
    status: "open",
  },
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonLd(job) {
  const canonicalUrl = `https://cintexa.com/careers/${job.slug}`;
  const absoluteImage = `https://cintexa.com${job.image}`;
  const posting = {
    "@type": "JobPosting",
    "@id": `${canonicalUrl}#jobposting`,
    title: job.role,
    name: job.title,
    description: [job.summary, job.description, `Requirements: ${job.requirements.join("; ")}`].join("\n\n"),
    identifier: { "@type": "PropertyValue", name: "CINTEXA Careers", value: job.id },
    datePosted: job.datePosted,
    validThrough: job.validThrough || undefined,
    employmentType: job.employmentType,
    hiringOrganization: { "@type": "Organization", name: "Hiring partner" },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: job.addressCountry || "GH",
        addressRegion: job.location,
      },
    },
    applicantLocationRequirements: { "@type": "Country", name: job.location },
    url: canonicalUrl,
    image: [absoluteImage],
    directApply: true,
    responsibilities: (job.responsibilities || []).join(". "),
    qualifications: job.requirements.join(". "),
    occupationalCategory: job.occupationalCategory || "37-2011.00",
    industry: "Facilities services",
  };
  Object.keys(posting).forEach((k) => posting[k] === undefined && delete posting[k]);
  return {
    "@context": "https://schema.org",
    "@graph": [
      posting,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://cintexa.com/" },
          { "@type": "ListItem", position: 2, name: "Careers", item: "https://cintexa.com/careers" },
          { "@type": "ListItem", position: 3, name: job.role, item: canonicalUrl },
        ],
      },
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: job.title,
        description: job.summary,
        about: { "@id": `${canonicalUrl}#jobposting` },
        inLanguage: "en",
      },
    ],
  };
}

function injectHead(template, { title, description, canonical, image, ldJson }) {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  // Replace or insert description
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    );
  } else {
    html = html.replace(
      "</head>",
      `    <meta name="description" content="${escapeHtml(description)}" />\n  </head>`,
    );
  }
  const extra = [
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<script type="application/ld+json">${JSON.stringify(ldJson)}</script>`,
  ].join("\n    ");
  html = html.replace("</head>", `    ${extra}\n  </head>`);
  return html;
}

function jobBody(job) {
  const wa = `https://wa.me/${job.applyWhatsApp}?text=${encodeURIComponent(
    `Hello, I am interested in the ${job.role} job vacancy. Please share application details.`,
  )}`;
  const reqs = job.requirements.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  return `
<main id="prerender-careers" style="max-width:42rem;margin:2rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;color:#F7F4EE;background:#0B0F14">
  <p style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:#F5C518">Careers · Open role</p>
  <h1 style="font-size:1.85rem;line-height:1.25;margin:0.5rem 0 0">${escapeHtml(job.title)}</h1>
  <p style="color:rgba(247,244,238,0.7);font-size:0.9rem">Title / Role: <strong style="color:#F7F4EE">${escapeHtml(job.role)}</strong> · ${escapeHtml(job.location)}</p>
  <img src="${escapeHtml(job.image)}" alt="${escapeHtml(job.role)} job vacancy" width="1200" height="750" style="width:100%;height:auto;border-radius:1rem;margin:1.5rem 0" />
  <p style="line-height:1.6">${escapeHtml(job.summary)}</p>
  <p style="line-height:1.6;color:rgba(247,244,238,0.75)">${escapeHtml(job.description)}</p>
  <h2 style="font-size:1.15rem;margin-top:1.5rem">Requirements</h2>
  <ul style="color:rgba(247,244,238,0.75)">${reqs}</ul>
  <p style="margin-top:1.5rem"><strong>Apply now:</strong>
    <a href="tel:${escapeHtml(job.applyPhone)}" style="color:#F5C518">Call ${escapeHtml(job.applyPhoneDisplay)}</a>
    ·
    <a href="${escapeHtml(wa)}" style="color:#F5C518">WhatsApp ${escapeHtml(job.applyPhoneDisplay)}</a>
  </p>
  <p style="font-size:0.8rem;color:rgba(247,244,238,0.55);margin-top:2rem"><a href="/careers" style="color:inherit">All careers</a></p>
</main>`;
}

function listBody(jobs) {
  const items = jobs
    .map(
      (j) => `
    <article style="margin:1.25rem 0;padding:1rem;border:1px solid rgba(247,244,238,0.12);border-radius:0.75rem">
      <h2 style="font-size:1.25rem;margin:0"><a href="/careers/${escapeHtml(j.slug)}" style="color:#F7F4EE;text-decoration:none">${escapeHtml(j.title)}</a></h2>
      <p style="color:rgba(247,244,238,0.7);font-size:0.9rem">Role: ${escapeHtml(j.role)} · ${escapeHtml(j.location)}</p>
      <p style="color:rgba(247,244,238,0.75);font-size:0.9rem">${escapeHtml(j.summary)}</p>
      <p><a href="/careers/${escapeHtml(j.slug)}" style="color:#F5C518">View role &amp; apply</a></p>
    </article>`,
    )
    .join("");
  return `
<main id="prerender-careers" style="max-width:42rem;margin:2rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;color:#F7F4EE;background:#0B0F14">
  <h1 style="font-size:1.85rem">Careers &amp; job vacancies</h1>
  <p style="color:rgba(247,244,238,0.75)">Open roles and application details. Call or WhatsApp listed contacts to apply.</p>
  ${items}
</main>`;
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
  const open = JOBS.filter((j) => j.status === "open");

  // /careers list
  let listHtml = injectHead(shell, {
    title: "Careers & Job Vacancies in Ghana | Apply Now",
    description:
      "Browse open job vacancies including Cleaners roles in Ghana for homes, offices, churches and more. Apply by call or WhatsApp. Job and scholarship alerts available.",
    canonical: "https://cintexa.com/careers",
    image: "https://cintexa.com/careers/cleaner-job-vacancy.jpeg",
    ldJson: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://cintexa.com/careers#webpage",
          url: "https://cintexa.com/careers",
          name: "Careers & Job Vacancies in Ghana | Apply Now",
          description:
            "Browse open job vacancies including Cleaners roles in Ghana for homes, offices, churches and more. Apply by call or WhatsApp.",
          inLanguage: "en",
        },
        {
          "@type": "ItemList",
          name: "Open job vacancies",
          numberOfItems: open.length,
          itemListElement: open.map((j, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://cintexa.com/careers/${j.slug}`,
            name: j.title,
            item: {
              "@type": "JobPosting",
              title: j.role,
              description: j.summary,
              datePosted: j.datePosted,
              employmentType: j.employmentType,
              url: `https://cintexa.com/careers/${j.slug}`,
              hiringOrganization: { "@type": "Organization", name: "Hiring partner" },
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressCountry: j.addressCountry || "GH",
                  addressRegion: j.location,
                },
              },
            },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://cintexa.com/" },
            { "@type": "ListItem", position: 2, name: "Careers", item: "https://cintexa.com/careers" },
          ],
        },
      ],
    },
  });
  listHtml = listHtml.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${listBody(open)}</div>`,
  );
  writePage("careers", listHtml);

  for (const job of open) {
    let page = injectHead(shell, {
      title: job.title,
      description: job.summary,
      canonical: `https://cintexa.com/careers/${job.slug}`,
      image: `https://cintexa.com${job.image}`,
      ldJson: jsonLd(job),
    });
    page = page.replace(/<div id="root"><\/div>/, `<div id="root">${jobBody(job)}</div>`);
    writePage(path.join("careers", job.slug), page);
  }

  // SPA fallback: Cloudflare serves directory index when present
  console.log(`prerender: done (${open.length} jobs + list)`);
}

run();

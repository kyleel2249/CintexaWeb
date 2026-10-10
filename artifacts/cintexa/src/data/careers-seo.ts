/**
 * Pure (DOM-free) SEO builders for the careers section.
 *
 * Used by BOTH the React pages (client-side navigation) and scripts/prerender-careers.mjs
 * (build-time HTML for crawlers and link-preview bots). Because they share these functions the
 * title, description, preview image, Open Graph, Twitter card and JSON-LD can never disagree,
 * and they are always computed from the live job data — nothing here is hard-coded per job.
 */
import type { JobPosting } from "./jobs";
import { DEFAULT_OG_IMAGE } from "./seo-master-map";

export const SITE_URL = "https://cintexa.com";
export const SITE_NAME = "CINTEXA";
const WEBSITE_ID = `${SITE_URL}/#website`;

export type PageSeoData = {
  /** Value for <title>. */
  title: string;
  /** Shorter title for og:title / twitter:title. */
  socialTitle: string;
  description: string;
  canonical: string;
  image: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  ogType: "website" | "article";
  twitterCard: "summary" | "summary_large_image";
  robots: string;
  jsonLd: Record<string, unknown> | null;
};

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function imageMimeType(src: string): string | undefined {
  const ext = src.split(/[?#]/)[0]?.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return undefined; // svg etc. are not valid social preview images
  }
}

/** Large card only when the image is wide enough not to be cropped badly. */
export function twitterCardFor(width?: number, height?: number): "summary" | "summary_large_image" {
  if (!width || !height) return "summary_large_image";
  return width / height >= 1.4 ? "summary_large_image" : "summary";
}

export function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : cut.length).replace(/[,;:.\s—-]+$/, "")}…`;
}

function countryName(code: string): string {
  return code === "GH" ? "Ghana" : code;
}

export function jobCanonical(job: Pick<JobPosting, "slug">): string {
  return `${SITE_URL}/careers/${job.slug}`;
}

const breadcrumb = (items: { name: string; item: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, ...it })),
});

const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
};

/** Google JobPosting-compatible JSON-LD (+ breadcrumb, page and website nodes). */
export function jobPostingJsonLd(job: JobPosting, canonicalUrl: string = jobCanonical(job)): Record<string, unknown> {
  const posting: Record<string, unknown> = {
    "@type": "JobPosting",
    "@id": `${canonicalUrl}#jobposting`,
    title: job.role,
    name: job.title,
    description: [job.summary, job.description, `Requirements: ${job.requirements.join("; ")}`]
      .filter(Boolean)
      .join("\n\n"),
    identifier: { "@type": "PropertyValue", name: "CINTEXA Careers", value: job.id },
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.employmentType,
    hiringOrganization: { "@type": "Organization", name: job.employerName ?? "Hiring partner" },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: job.addressCountry,
        addressRegion: job.addressRegion ?? job.location,
        addressLocality: job.addressLocality,
      },
    },
    applicantLocationRequirements: { "@type": "Country", name: countryName(job.addressCountry) },
    url: canonicalUrl,
    image: [absoluteUrl(job.socialImage)],
    directApply: true,
    responsibilities: job.responsibilities.join(". "),
    qualifications: job.requirements.join(". "),
    occupationalCategory: job.occupationalCategory,
    industry: job.industry,
  };
  const address = (posting.jobLocation as { address: Record<string, unknown> }).address;
  for (const obj of [posting, address]) {
    Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      posting,
      breadcrumb([
        { name: "Home", item: `${SITE_URL}/` },
        { name: "Careers", item: `${SITE_URL}/careers` },
        { name: job.role, item: canonicalUrl },
      ]),
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: job.title,
        description: job.summary,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": `${canonicalUrl}#jobposting` },
        primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(job.socialImage) },
        inLanguage: "en",
      },
      websiteNode,
    ],
  };
}

function joinRoles(roles: string[]): string {
  if (roles.length <= 1) return roles[0] ?? "";
  return `${roles.slice(0, -1).join(", ")} and ${roles[roles.length - 1]}`;
}

const LIST_TITLE = "Careers & Job Vacancies in Ghana | CINTEXA";

function listDescription(jobs: JobPosting[]): string {
  return jobs.length
    ? clip(
        `Open job vacancies in Ghana: ${joinRoles(jobs.map((j) => j.role))}. Apply by call or WhatsApp, and sign up for job and scholarship alerts.`,
        200,
      )
    : "Careers at CINTEXA and partner vacancies in Ghana. Sign up for job and scholarship alerts.";
}

export function careersListJsonLd(jobs: JobPosting[]): Record<string, unknown> {
  const title = LIST_TITLE;
  const description = listDescription(jobs);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/careers#webpage`,
        url: `${SITE_URL}/careers`,
        name: title,
        description,
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "en",
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/careers#joblist`,
        name: "Open job vacancies",
        numberOfItems: jobs.length,
        itemListElement: jobs.map((j, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: jobCanonical(j),
          name: j.title,
        })),
      },
      breadcrumb([
        { name: "Home", item: `${SITE_URL}/` },
        { name: "Careers", item: `${SITE_URL}/careers` },
      ]),
      websiteNode,
    ],
  };
}

/** SEO + social preview data for one vacancy, derived entirely from the job record. */
export function jobSeo(job: JobPosting): PageSeoData {
  const canonical = jobCanonical(job);
  const imageType = imageMimeType(job.socialImage);
  return {
    title: `${job.title} | CINTEXA Careers`,
    socialTitle: job.title,
    description: clip(job.summary, 200),
    canonical,
    image: absoluteUrl(job.socialImage),
    imageAlt: job.imageAlt ?? `${job.role} job vacancy — ${job.location}`,
    imageWidth: job.socialImageWidth,
    imageHeight: job.socialImageHeight,
    imageType,
    ogType: "website",
    twitterCard: twitterCardFor(job.socialImageWidth, job.socialImageHeight),
    robots: "index, follow, max-image-preview:large",
    jsonLd: jobPostingJsonLd(job, canonical),
  };
}

/**
 * SEO + social preview data for /careers. `jobs` must already be ordered newest-first
 * (getOpenJobs does that); the preview image follows the newest vacancy automatically.
 */
export function careersListSeo(jobs: JobPosting[]): PageSeoData {
  const newest = jobs[0];
  const description = listDescription(jobs);
  const image = newest ? absoluteUrl(newest.socialImage) : DEFAULT_OG_IMAGE;
  const w = newest?.socialImageWidth;
  const h = newest?.socialImageHeight;
  return {
    title: LIST_TITLE,
    socialTitle: jobs.length
      ? `Careers & Job Vacancies in Ghana — ${jobs.length} open ${jobs.length === 1 ? "role" : "roles"}`
      : "Careers & Job Vacancies in Ghana",
    description,
    canonical: `${SITE_URL}/careers`,
    image,
    imageAlt: newest ? (newest.imageAlt ?? `${newest.role} job vacancy`) : "CINTEXA careers",
    imageWidth: newest ? w : 1200,
    imageHeight: newest ? h : 630,
    imageType: newest ? imageMimeType(newest.socialImage) : undefined,
    ogType: "website",
    twitterCard: newest ? twitterCardFor(w, h) : "summary_large_image",
    robots: "index, follow, max-image-preview:large",
    jsonLd: careersListJsonLd(jobs),
  };
}

/** Closed / expired / unknown vacancy: keep it out of the index (avoids soft-404 pages). */
export function jobNotFoundSeo(): PageSeoData {
  return {
    title: "Job not found | CINTEXA Careers",
    socialTitle: "Job not found",
    description: "This vacancy may have closed or the link is incorrect. See all open roles at CINTEXA Careers.",
    canonical: `${SITE_URL}/careers`,
    image: DEFAULT_OG_IMAGE,
    imageAlt: "CINTEXA careers",
    ogType: "website",
    twitterCard: "summary_large_image",
    robots: "noindex, follow",
    jsonLd: null,
  };
}

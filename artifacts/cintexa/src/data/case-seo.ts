/**
 * Pure SEO builders for the case-studies section, shared by the React pages (client navigation) and
 * scripts/prerender-case-studies.mjs (static HTML for crawlers and link-preview bots). Everything comes
 * from the case record, so the preview image, Open Graph / Twitter tags and structured data always match
 * the case on the page.
 */
import type { PageSeoData } from "./careers-seo";
import { SITE_URL, absoluteUrl, clip } from "./careers-seo";
import { CASE_IMAGE_SIZE, STATUS_LABEL, caseImagePath, caseUrlPath, type CaseStudy } from "./case-studies";

const WEBSITE_ID = `${SITE_URL}/#website`;
const PUBLISHER = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "CINTEXA",
  url: `${SITE_URL}/`,
};

export const caseCanonical = (c: Pick<CaseStudy, "slug">) => `${SITE_URL}${caseUrlPath(c)}`;

const breadcrumb = (items: { name: string; item: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, ...it })),
});

const website = { "@type": "WebSite", "@id": WEBSITE_ID, url: `${SITE_URL}/`, name: "CINTEXA" };

export const LIST_TITLE = "Case Studies | CINTEXA";
export const LIST_INTRO =
  "Good case studies explain the work and the evidence behind its outcome. The examples below are clearly labelled illustrative scenarios, not claims about completed client engagements. Verified client case studies can replace them when permission and supporting data are available.";
const LIST_DESCRIPTION =
  "Review CINTEXA case-study formats showing problem assessment, solution, implementation, measurement and technology without fabricated results.";

export function caseJsonLd(c: CaseStudy): Record<string, unknown> {
  const url = caseCanonical(c);
  const image = absoluteUrl(caseImagePath(c));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: c.title,
        name: c.title,
        description: c.summary,
        image: [image],
        url,
        mainEntityOfPage: { "@id": url },
        datePublished: c.datePublished,
        dateModified: c.dateUpdated,
        author: PUBLISHER,
        publisher: PUBLISHER,
        articleSection: c.service,
        about: c.industry,
        keywords: c.technologyTags.join(", "),
        genre: STATUS_LABEL[c.status],
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
      },
      breadcrumb([
        { name: "Home", item: `${SITE_URL}/` },
        { name: "Case studies", item: `${SITE_URL}/case-studies` },
        { name: c.title, item: url },
      ]),
      website,
    ],
  };
}

export function caseListJsonLd(cases: CaseStudy[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/case-studies#webpage`,
        url: `${SITE_URL}/case-studies`,
        name: LIST_TITLE,
        description: LIST_DESCRIPTION,
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "en",
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/case-studies#list`,
        name: "CINTEXA case studies",
        numberOfItems: cases.length,
        itemListElement: cases.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: caseCanonical(c), name: c.title })),
      },
      breadcrumb([
        { name: "Home", item: `${SITE_URL}/` },
        { name: "Case studies", item: `${SITE_URL}/case-studies` },
      ]),
      website,
    ],
  };
}

/** SEO + social preview for one case study, derived entirely from its record. */
export function caseSeo(c: CaseStudy): PageSeoData {
  return {
    title: `${c.title} | CINTEXA Case Studies`,
    socialTitle: `${c.title} — ${STATUS_LABEL[c.status]}`,
    description: clip(c.summary, 200),
    canonical: caseCanonical(c),
    image: absoluteUrl(caseImagePath(c)),
    imageAlt: `${c.title} — CINTEXA case study (${STATUS_LABEL[c.status].toLowerCase()}) · ${c.service}`,
    imageWidth: CASE_IMAGE_SIZE.width,
    imageHeight: CASE_IMAGE_SIZE.height,
    imageType: "image/png",
    ogType: "article",
    twitterCard: "summary_large_image",
    robots: "index, follow, max-image-preview:large",
    jsonLd: caseJsonLd(c),
  };
}

/** /case-studies. The preview image follows the newest case (like /careers follows the newest vacancy). */
export function caseListSeo(cases: CaseStudy[]): PageSeoData {
  const lead = cases[0];
  return {
    title: LIST_TITLE,
    socialTitle: cases.length ? `Case Studies — ${cases.length} ${cases.length === 1 ? "example" : "examples"}` : "Case Studies",
    description: LIST_DESCRIPTION,
    canonical: `${SITE_URL}/case-studies`,
    image: lead ? absoluteUrl(caseImagePath(lead)) : `${SITE_URL}/favicon.svg`,
    imageAlt: lead ? `${lead.title} — CINTEXA case study` : "CINTEXA case studies",
    imageWidth: lead ? CASE_IMAGE_SIZE.width : undefined,
    imageHeight: lead ? CASE_IMAGE_SIZE.height : undefined,
    imageType: lead ? "image/png" : undefined,
    ogType: "website",
    twitterCard: lead ? "summary_large_image" : "summary",
    robots: "index, follow, max-image-preview:large",
    jsonLd: caseListJsonLd(cases),
  };
}

/** Unknown slug: keep it out of the index (no soft-404). */
export function caseNotFoundSeo(): PageSeoData {
  return {
    title: "Case study not found | CINTEXA",
    socialTitle: "Case study not found",
    description: "This case study doesn’t exist or has moved. Browse all CINTEXA case studies.",
    canonical: `${SITE_URL}/case-studies`,
    image: `${SITE_URL}/favicon.svg`,
    imageAlt: "CINTEXA case studies",
    ogType: "website",
    twitterCard: "summary",
    robots: "noindex, follow",
    jsonLd: null,
  };
}

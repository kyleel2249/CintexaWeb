/**
 * Reusable schema.org JSON-LD builders. Pure functions (no DOM/React) so the React pages
 * (client navigation) and the build-time prerender produce IDENTICAL structured data.
 *
 * Principles
 *  - One full Organization node per page (id `https://cintexa.com/#organization`); every other node
 *    refers to it by `@id`, never by re-declaring it with different properties.
 *  - Only describe what is visible on the page (FAQ nodes mirror the rendered FAQ; breadcrumbs mirror
 *    the visible breadcrumb).
 *  - No invented ratings, reviews, prices, offers, addresses or opening hours.
 *  - Undefined properties are stripped, so optional data never leaks `undefined`/`null` into output.
 */
import { ENTITY, ORG_ID, SITE_NAME, SITE_URL, WEBSITE_ID, abs, type ServiceEntry } from "./site-entity";

export type JsonLdNode = Record<string, unknown>;
export type Crumb = { name: string; path: string };
export type Faq = { q: string; a: string };

/** Removes undefined/empty values recursively so the output is minimal and valid. */
export function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null || v === "") continue;
      const c = clean(v);
      if (Array.isArray(c) && c.length === 0) continue;
      out[k] = c;
    }
    return out as T;
  }
  return value;
}

export function organizationNode(): JsonLdNode {
  return clean({
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: ENTITY.url,
    description: ENTITY.description,
    logo: { "@type": "ImageObject", url: ENTITY.logo, width: ENTITY.logoWidth, height: ENTITY.logoHeight },
    image: ENTITY.defaultImage,
    email: ENTITY.email,
    telephone: ENTITY.phone,
    sameAs: [...ENTITY.sameAs],
    areaServed: { "@type": "Country", name: ENTITY.areaServed },
    knowsAbout: [...ENTITY.knowsAbout],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: ENTITY.email,
      telephone: ENTITY.phone,
      availableLanguage: "English",
      areaServed: "GH",
    },
  });
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: ENTITY.url,
    name: SITE_NAME,
    inLanguage: ENTITY.language,
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbNode(pageUrl: string, crumbs: Crumb[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

export type WebPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "ItemPage" | "FAQPage";

export function webPageNode(opts: {
  url: string;
  name: string;
  description: string;
  type?: WebPageType | WebPageType[];
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  dateModified?: string;
  datePublished?: string;
  /** @id of the main entity the page is about (e.g. the Service node). */
  about?: string;
  /** Home page only: marks the page as the entity's primary page. */
  isHome?: boolean;
  hasBreadcrumb?: boolean;
  hasFaq?: boolean;
}): JsonLdNode {
  return clean({
    "@type": opts.type ?? "WebPage",
    "@id": opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: opts.about ? { "@id": opts.about } : opts.isHome ? { "@id": ORG_ID } : undefined,
    publisher: { "@id": ORG_ID },
    primaryImageOfPage: opts.image
      ? { "@type": "ImageObject", url: opts.image, width: opts.imageWidth, height: opts.imageHeight }
      : undefined,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    inLanguage: ENTITY.language,
    breadcrumb: opts.hasBreadcrumb === false ? undefined : { "@id": `${opts.url}#breadcrumb` },
    mainEntity: opts.hasFaq ? { "@id": `${opts.url}#faq` } : undefined,
  });
}

export function serviceNode(svc: Pick<ServiceEntry, "name" | "path" | "serviceType" | "summary">, extra?: { description?: string; audience?: string }): JsonLdNode {
  const url = abs(svc.path);
  return clean({
    "@type": "Service",
    "@id": `${url}#service`,
    name: svc.name,
    serviceType: svc.serviceType,
    description: extra?.description ?? svc.summary,
    url,
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: ENTITY.areaServed },
    audience: extra?.audience ? { "@type": "Audience", audienceType: extra.audience } : undefined,
  });
}

/** FAQPage node. Pass the SAME array that the page renders. */
export function faqNode(pageUrl: string, faqs: Faq[]): JsonLdNode | null {
  if (!faqs.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function itemListNode(pageUrl: string, name: string, items: { name: string; path: string }[]): JsonLdNode {
  return {
    "@type": "ItemList",
    "@id": `${pageUrl}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(it.path) })),
  };
}

export function blogPostingNode(post: {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  date: string;
  updated?: string;
  category: string;
  keyword: string;
  wordCount?: number;
  about?: string;
}): JsonLdNode {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return clean({
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    image: { "@type": "ImageObject", url: post.image, width: post.imageWidth, height: post.imageHeight },
    url,
    mainEntityOfPage: { "@id": url },
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Organization", "@id": ORG_ID, name: "CINTEXA Editorial Team", url: abs("/about") },
    publisher: { "@id": ORG_ID },
    articleSection: post.category,
    keywords: post.keyword,
    wordCount: post.wordCount,
    about: post.about ? { "@id": post.about } : undefined,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: ENTITY.language,
  });
}

/** Wraps nodes in a single `@graph`, de-duplicating by `@id` (first occurrence wins). */
export function graph(...nodes: (JsonLdNode | null | undefined)[]): Record<string, unknown> {
  const seen = new Set<string>();
  const out: JsonLdNode[] = [];
  for (const n of nodes) {
    if (!n) continue;
    const id = typeof n["@id"] === "string" ? (n["@id"] as string) : undefined;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(n);
  }
  return { "@context": "https://schema.org", "@graph": out };
}

/** JSON for embedding in <script type="application/ld+json">: cannot terminate the tag or break parsers. */
export function safeJsonLd(obj: unknown): string {
  // U+2028 / U+2029 are line terminators in older JS engines; escape them (built from char codes so this file stays ASCII-clean).
  const ls = String.fromCharCode(0x2028);
  const ps = String.fromCharCode(0x2029);
  return JSON.stringify(obj).replace(/</g, "\\u003c").split(ls).join("\\u2028").split(ps).join("\\u2029");
}

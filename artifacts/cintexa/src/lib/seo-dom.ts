import type { PageSeoData } from "@/data/careers-seo";

const PAGE_LD_SELECTOR = 'script[type="application/ld+json"][data-seo="page"]';

function upsertMeta(attr: "name" | "property", key: string, content: string | undefined) {
  const selector = `meta[${attr}="${key}"]`;
  const existing = document.querySelector(selector) as HTMLMetaElement | null;
  if (content === undefined || content === "") {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement("meta");
  if (!existing) {
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

export function removePageJsonLd() {
  document.querySelectorAll(PAGE_LD_SELECTOR).forEach((n) => n.remove());
}

/**
 * Applies a complete, internally-consistent head for the current page: title, description,
 * canonical, robots, Open Graph, Twitter card and JSON-LD. Optional tags (image size/type) are
 * REMOVED when unknown so values from a previously visited page can never leak into this one.
 * The prerendered JSON-LD is tagged data-seo="page", so it is replaced instead of duplicated.
 *
 * Returns a cleanup function that removes the page JSON-LD (call it on unmount).
 */
export function applyPageSeo(seo: PageSeoData): () => void {
  document.title = seo.title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", seo.robots);
  upsertCanonical(seo.canonical);

  upsertMeta("property", "og:type", seo.ogType);
  upsertMeta("property", "og:site_name", "CINTEXA");
  upsertMeta("property", "og:url", seo.canonical);
  upsertMeta("property", "og:title", seo.socialTitle);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:image", seo.image);
  upsertMeta("property", "og:image:secure_url", seo.image);
  upsertMeta("property", "og:image:alt", seo.imageAlt);
  upsertMeta("property", "og:image:width", seo.imageWidth ? String(seo.imageWidth) : undefined);
  upsertMeta("property", "og:image:height", seo.imageHeight ? String(seo.imageHeight) : undefined);
  upsertMeta("property", "og:image:type", seo.imageType);

  upsertMeta("name", "twitter:card", seo.twitterCard);
  upsertMeta("name", "twitter:title", seo.socialTitle);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", seo.image);
  upsertMeta("name", "twitter:image:alt", seo.imageAlt);

  removePageJsonLd();
  if (seo.jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo", "page");
    script.textContent = JSON.stringify(seo.jsonLd);
    document.head.appendChild(script);
  }
  return removePageJsonLd;
}

import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, absoluteUrl, getSeoForPath, type SeoPageEntry } from "@/data/seo-master-map";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

function setRobots(noIndex: boolean) {
  setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
}

/**
 * Applies ELSIM master-map SEO: title, description, OG/Twitter, canonical, robots.
 * Job detail keeps its own JobPosting JSON-LD via JobDetail page.
 */
export function applySeo(entry: SeoPageEntry, pathname: string) {
  const url = absoluteUrl(pathname.replace(/\/$/, "") || "/");
  // Prefer the first meaningful image in page content so previews reflect the leading visual/update.
  const pageImage = document.querySelector("main img[src]") as HTMLImageElement | null;
  const pageImageSrc = pageImage?.getAttribute("src");
  const resolvedPageImage = pageImageSrc
    ? new URL(pageImageSrc, window.location.origin).toString()
    : undefined;
  const image = resolvedPageImage || entry.ogImage || DEFAULT_OG_IMAGE;

  document.title = entry.metaTitle;
  setMeta("name", "description", entry.metaDescription);
  setCanonical(url);
  setRobots(Boolean(entry.noIndex));

  setMeta("property", "og:type", entry.path === "/" ? "website" : "article");
  setMeta("property", "og:site_name", "Cintexa");
  setMeta("property", "og:url", url);
  setMeta("property", "og:title", entry.metaTitle);
  setMeta("property", "og:description", entry.metaDescription);
  setMeta("property", "og:image", image);
  setMeta("property", "og:image:secure_url", image);
  setMeta("property", "og:image:alt", entry.imageAlt[0] || entry.metaTitle);
  // Size/type belong to a specific image; drop stale values left by index.html or a previous page.
  ["og:image:width", "og:image:height", "og:image:type"].forEach((key) =>
    document.querySelector(`meta[property="${key}"]`)?.remove(),
  );

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", entry.metaTitle);
  setMeta("name", "twitter:description", entry.metaDescription);
  setMeta("name", "twitter:image", image);
  setMeta("name", "twitter:image:alt", entry.imageAlt[0] || entry.metaTitle);
}

export function usePageSeo(pathname: string) {
  useEffect(() => {
    // These routes set metadata from their own editorial content; do not overwrite it with the global fallback.
    // /careers and /careers/:slug build their own head from the live job data (see careers-seo.ts).
    if (pathname === "/careers" || pathname.startsWith("/careers/")) return;
    if (pathname.startsWith("/blog/") || ["/about", "/case-studies", "/privacy-policy", "/terms", "/cookie-policy", "/disclaimer"].includes(pathname)) return;
    const entry = getSeoForPath(pathname);
    applySeo(entry, pathname);
  }, [pathname]);
}

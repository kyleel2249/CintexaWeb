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
  const image = entry.ogImage || DEFAULT_OG_IMAGE;

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
  setMeta("property", "og:image:alt", entry.imageAlt[0] || entry.metaTitle);

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", entry.metaTitle);
  setMeta("name", "twitter:description", entry.metaDescription);
  setMeta("name", "twitter:image", image);
  setMeta("name", "twitter:image:alt", entry.imageAlt[0] || entry.metaTitle);
}

export function usePageSeo(pathname: string) {
  useEffect(() => {
    const entry = getSeoForPath(pathname);
    applySeo(entry, pathname);
  }, [pathname]);
}

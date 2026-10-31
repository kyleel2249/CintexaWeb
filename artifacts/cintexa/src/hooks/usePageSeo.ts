import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo-dom";

/** Routes whose pages build their own head from live content (careers, case studies, blog articles, web design). */
function ownsItsHead(path: string): boolean {
  return (
    path === "/careers" ||
    path.startsWith("/careers/") ||
    path === "/case-studies" ||
    path.startsWith("/case-studies/") ||
    path.startsWith("/blog/") ||
    path === "/solutions/website-development"
  );
}

const isPrivateArea = (path: string) =>
  path === "/dashboard" || path.startsWith("/dashboard/") || path === "/admin" || path.startsWith("/admin/") || path === "/sign-in" || path === "/sign-up";

/**
 * Applies the full head (title, description, canonical, robots, Open Graph, Twitter, JSON-LD) for every static route from
 * the central registry in data/seo-pages.ts. The registry is loaded lazily so it never weighs down the first bundle; the
 * prerendered HTML already carries the same head, so crawlers and link previews do not wait for this.
 *
 * Unknown routes are left alone: NotFound sets its own noindex head. (Previously every unknown URL inherited the home
 * page's canonical and indexable robots tag.)
 */
export function usePageSeo(pathname: string) {
  useEffect(() => {
    const path = pathname.replace(/\/+$/, "") || "/";
    if (ownsItsHead(path)) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void (async () => {
      const pages = await import("@/data/seo-pages");
      if (cancelled) return;
      let seo = path === "/blog" ? (await import("@/data/seo-blog")).blogListSeo() : pages.staticPageSeo(path);
      if (!seo && isPrivateArea(path)) seo = pages.privateAreaSeo(path.startsWith("/admin") ? "Admin | CINTEXA" : "CINTEXA");
      if (!seo || cancelled) return;
      cleanup = applyPageSeo(seo);
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [pathname]);
}

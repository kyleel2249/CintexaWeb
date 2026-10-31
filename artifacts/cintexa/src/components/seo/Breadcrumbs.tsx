import { Link } from "wouter";
import type { Crumb } from "@/data/seo-schema";

/**
 * Visible breadcrumb. Pass the SAME trail that the page's BreadcrumbList JSON-LD is built from
 * (`breadcrumbTrail(page)` for static pages, `blogPostCrumbs(post)` for articles) so markup and schema always match.
 */
export function Breadcrumbs({ trail, className = "" }: { trail: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-xs text-[hsl(var(--fg-muted))] ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={c.path} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <span aria-hidden>›</span>}
              {last ? (
                <span aria-current="page" className="truncate text-[hsl(var(--fg))]">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="hover:text-[hsl(var(--fg))]">
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

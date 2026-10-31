import { Link } from "wouter";
import type { ArticleRef, RelatedLink } from "@/data/page-content";

/** Related services (descriptive anchor text + one-line context). */
export function RelatedServices({ title = "Related services", links, className = "" }: { title?: string; links: RelatedLink[]; className?: string }) {
  if (!links.length) return null;
  return (
    <section aria-label={title} className={className}>
      <h2 className="cx-display text-xl">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="cx-card cx-card-interactive block h-full">
              <span className="font-medium text-[hsl(var(--fg))]">{r.label}</span>
              <span className="mt-1 block text-sm text-[hsl(var(--fg-muted))]">{r.copy}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Articles that explain the topic in more depth (service -> article link). */
export function RelatedArticles({ title = "Learn more", articles, className = "" }: { title?: string; articles: ArticleRef[]; className?: string }) {
  if (!articles.length) return null;
  return (
    <section aria-label={title} className={className}>
      <h2 className="cx-display text-xl">{title}</h2>
      <ul className="mt-4 space-y-2">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/blog/${a.slug}`} className="text-[hsl(var(--accent))] underline">
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

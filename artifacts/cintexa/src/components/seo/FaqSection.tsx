import type { Faq } from "@/data/seo-schema";

/**
 * Accessible FAQ list (native <details>, so it works without JavaScript and every answer stays in the HTML).
 * Render the SAME `faqs` array that the page's FAQPage JSON-LD is built from.
 */
export function FaqSection({ id, title = "Frequently asked questions", faqs, className = "" }: { id: string; title?: string; faqs: Faq[]; className?: string }) {
  if (!faqs.length) return null;
  const headingId = `${id}-faq-title`;
  return (
    <section aria-labelledby={headingId} className={className} data-faq={id}>
      <p className="cx-eyebrow">FAQ</p>
      <h2 id={headingId} className="cx-display mt-2 text-2xl sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="cx-card group">
            <summary className="cursor-pointer font-medium text-[hsl(var(--fg))]">{f.q}</summary>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--fg-muted))]">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

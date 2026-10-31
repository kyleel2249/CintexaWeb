import { useEffect } from "react";
import { Link } from "wouter";
import { RelatedArticles } from "@/components/seo/RelatedLinks";
import { getCaseStudies, STATUS_LABEL } from "@/data/case-studies";
import { SOLUTION_CONTENT } from "@/data/page-content";
import { WEB_DESIGN, WEB_DESIGN_LABEL, WEB_DESIGN_PATH } from "@/data/web-design";
import { webDesignSeo } from "@/data/web-design-seo";
import { applyPageSeo } from "@/lib/seo-dom";
import { trackEvent } from "@/lib/tracking";

/**
 * Web Design & Development service page (canonical: /solutions/website-development).
 * All copy lives in src/data/web-design.json; the same data feeds the prerendered HTML, JSON-LD and sitemap.
 */
export function WebsiteDev() {
  const c = WEB_DESIGN;
  const cases = getCaseStudies().filter((k) => k.serviceHref === WEB_DESIGN_PATH);
  useEffect(() => applyPageSeo(webDesignSeo()), []);

  return (
    <div className="cx-section">
      <div className="cx-container">
        <nav aria-label="Breadcrumb" className="text-xs text-[hsl(var(--fg-muted))]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[hsl(var(--fg))]">Home</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-[hsl(var(--fg))]">{WEB_DESIGN_LABEL}</li>
          </ol>
        </nav>

        <header className="mt-6">
          <p className="cx-eyebrow">{c.eyebrow}</p>
          <h1 className="cx-display mt-3 max-w-3xl text-3xl sm:text-5xl">{c.h1}</h1>
          <p className="cx-display mt-3 text-xl text-[hsl(var(--accent))]">{c.headline}</p>
          <p className="mt-4 max-w-2xl leading-relaxed text-[hsl(var(--fg-muted))]">{c.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="cx-btn cx-btn-primary cx-btn-lg" onClick={() => trackEvent("web_design_cta", { placement: "hero" })}>
              Request a Website Consultation
            </Link>
            <a href="#services" className="cx-btn cx-btn-secondary cx-btn-lg">Explore Our Services</a>
            <Link href="/case-studies" className="cx-btn cx-btn-secondary cx-btn-lg">View Our Work</Link>
          </div>
        </header>

        <section id="services" className="mt-14 scroll-mt-24" aria-labelledby="services-title">
          <p className="cx-eyebrow">What we build</p>
          <h2 id="services-title" className="cx-display mt-2 text-2xl sm:text-3xl">Website design and development services</h2>
          <p className="mt-3 max-w-2xl text-sm text-[hsl(var(--fg-muted))]">
            Every business needs something different from its website. These are the types of site we design and develop.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {c.services.map((s) => (
              <article key={s.id} id={s.id} className="cx-card flex flex-col scroll-mt-24" aria-labelledby={`${s.id}-t`}>
                <h3 id={`${s.id}-t`} className="cx-display text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]"><strong className="text-[hsl(var(--fg))]">The need: </strong>{s.problem}</p>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]"><strong className="text-[hsl(var(--fg))]">Our solution: </strong>{s.solution}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--fg-muted))]">
                  {s.benefits.map((b) => <li key={b}>{b}</li>)}
                </ul>
                <p className="mt-3 text-xs text-[hsl(var(--fg-muted))]"><span className="cx-eyebrow">Features</span> · {s.features.join(" · ")}</p>
                <div className="mt-auto pt-4">
                  <Link href={s.cta.href} className="text-sm font-medium text-[hsl(var(--accent))] hover:underline">{s.cta.label} →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="process-title">
          <p className="cx-eyebrow">How we work</p>
          <h2 id="process-title" className="cx-display mt-2 text-2xl sm:text-3xl">From discovery to launch and beyond</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {c.process.map((p) => (
              <li key={p.step} className="cx-card border-t-2 border-t-[hsl(var(--accent))]">
                <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>{p.step}</p>
                <h3 className="cx-display mt-2 text-lg">{p.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{p.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14" aria-labelledby="standards-title">
          <p className="cx-eyebrow">Quality standards</p>
          <h2 id="standards-title" className="cx-display mt-2 text-2xl sm:text-3xl">Built to perform, to be used by everyone, and to be found</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {c.standards.map((s) => (
              <div key={s.title} className="cx-card">
                <h3 className="cx-display text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {cases.length > 0 && (
          <section className="mt-14" aria-labelledby="work-title">
            <p className="cx-eyebrow">Our work</p>
            <h2 id="work-title" className="cx-display mt-2 text-2xl sm:text-3xl">Related case studies</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {cases.map((k) => (
                <Link key={k.slug} href={`/case-studies/${k.slug}`} className="cx-card cx-card-interactive block">
                  <span className="cx-badge">{STATUS_LABEL[k.status]}</span>
                  <h3 className="cx-display mt-2 text-lg">{k.title}</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{k.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14" aria-labelledby="faq-title">
          <p className="cx-eyebrow">FAQ</p>
          <h2 id="faq-title" className="cx-display mt-2 text-2xl sm:text-3xl">Web design and development questions</h2>
          <div className="mt-6 space-y-3">
            {c.faqs.map((f) => (
              <details key={f.q} className="cx-card group">
                <summary className="cursor-pointer font-medium text-[hsl(var(--fg))]">{f.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--fg-muted))]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <RelatedArticles articles={SOLUTION_CONTENT["website-development"].articles} className="mt-14" />

        <section className="mt-14" aria-labelledby="related-title">
          <h2 id="related-title" className="cx-display text-xl">Related services</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="cx-card cx-card-interactive block h-full">
                  <span className="font-medium text-[hsl(var(--fg))]">{r.label}</span>
                  <span className="mt-1 block text-sm text-[hsl(var(--fg-muted))]">{r.copy}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-6 text-center sm:p-10" aria-labelledby="contact-title">
          <h2 id="contact-title" className="cx-display text-2xl sm:text-3xl">Ready to discuss your website?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
            Tell us about your business and what you need. We will respond with the questions that shape a clear scope and estimate.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="cx-btn cx-btn-primary cx-btn-lg" onClick={() => trackEvent("web_design_cta", { placement: "footer" })}>
              Request a Website Consultation
            </Link>
            <Link href="/get-started" className="cx-btn cx-btn-secondary cx-btn-lg">Discuss Your Project</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default WebsiteDev;

import { useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { CaseBadges } from "@/components/case-studies/CaseBadges";
import { ShareBar } from "@/components/ShareBar";
import { CASE_SECTIONS, STATUS_LABEL, caseToc, caseUrlPath, getCaseStudies, getCaseStudy, readingMinutes } from "@/data/case-studies";
import { caseCanonical, caseNotFoundSeo, caseSeo } from "@/data/case-seo";
import { adjacentCases, relatedCases, similarProjectLink } from "@/lib/case-filter";
import { applyPageSeo } from "@/lib/seo-dom";
import { useActiveSection } from "@/lib/use-active-section";

const dateLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: "long", timeZone: "UTC" });

export function CaseStudyDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const c = useMemo(() => getCaseStudy(slug), [slug]);
  const all = useMemo(() => getCaseStudies(), []);
  useEffect(() => applyPageSeo(c ? caseSeo(c) : caseNotFoundSeo()), [c]);
  const toc = useMemo(() => (c ? caseToc(c) : []), [c]);
  const active = useActiveSection(toc.map((t) => t.id));

  if (!c) {
    return (
      <div className="cx-section">
        <div className="cx-container max-w-xl">
          <p className="cx-eyebrow">Case studies</p>
          <h1 className="cx-display mt-3 text-3xl">Case study not found</h1>
          <p className="mt-3 text-[hsl(var(--fg-muted))]">This case study doesn’t exist or has moved.</p>
          <Link href="/case-studies" className="cx-btn cx-btn-primary mt-6 inline-flex">
            Browse case studies
          </Link>
        </div>
      </div>
    );
  }

  const related = relatedCases(c, all, 2);
  const { prev, next } = adjacentCases(c, all);
  const h2 = "cx-display scroll-mt-24 text-xl text-[hsl(var(--fg))]";

  return (
    <div className="cx-section">
      <div className="cx-container">
        <nav aria-label="Breadcrumb" className="cx-no-print text-xs text-[hsl(var(--fg-muted))]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[hsl(var(--fg))]">
                Home
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/case-studies" className="hover:text-[hsl(var(--fg))]">
                Case studies
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-[hsl(var(--fg))]">
              {c.title}
            </li>
          </ol>
        </nav>

        <div className="mt-4">
          <CaseBadges c={c} />
        </div>
        <h1 className="cx-display mt-3 max-w-3xl text-3xl sm:text-4xl">{c.title}</h1>
        <p className="mt-3 max-w-3xl text-[hsl(var(--fg-muted))]">{c.summary}</p>
        <p className="mt-2 text-xs text-[hsl(var(--fg-muted))]">
          Updated {dateLabel(c.dateUpdated)} · {readingMinutes(c)} min read
        </p>

        <div className="cx-no-print mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
        <div className="cx-no-print mt-3">
          <ShareBar url={caseCanonical(c)} title={c.title} text={`${c.title} — CINTEXA case study`} />
        </div>

        {c.status === "illustrative" && (
          <p className="mt-6 max-w-3xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-4 text-sm" role="note">
            <strong>{STATUS_LABEL.illustrative}.</strong> This describes a typical engagement and what would be measured. It is not a record of a completed
            client project, and no client results are claimed.
          </p>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <article className="min-w-0 space-y-10">
            {CASE_SECTIONS.slice(0, 5).map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
                <h2 id={`${s.id}-h`} className={h2}>
                  {s.label}
                </h2>
                <p className="mt-3 leading-relaxed text-[hsl(var(--fg-muted))]">{c[s.field]}</p>
              </section>
            ))}

            {c.status === "verified" && c.evidence?.length ? (
              <section id="evidence" aria-labelledby="evidence-h">
                <h2 id="evidence-h" className={h2}>
                  Measured results
                </h2>
                {c.client && <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Client: {c.client} (shared with their permission).</p>}
                <div className="mt-3 overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">
                        <th className="px-4 py-3">Measure</th>
                        <th className="px-4 py-3">Before</th>
                        <th className="px-4 py-3">After</th>
                        <th className="px-4 py-3">Period</th>
                        <th className="px-4 py-3">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.evidence.map((e) => (
                        <tr key={e.metric} className="border-t border-[hsl(var(--border))]">
                          <td className="px-4 py-3 font-medium">{e.metric}</td>
                          <td className="px-4 py-3">{e.before}</td>
                          <td className="px-4 py-3">{e.after}</td>
                          <td className="px-4 py-3">{e.period}</td>
                          <td className="px-4 py-3">{e.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section id="measurement" aria-labelledby="measurement-h">
              <h2 id="measurement-h" className={h2}>
                How it would be measured
              </h2>
              <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">Each outcome is agreed and baselined before work starts, so results can be checked rather than asserted.</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">
                      <th className="px-4 py-3">Measure</th>
                      <th className="px-4 py-3">Why it matters</th>
                      <th className="px-4 py-3">How it is measured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.metrics.map((m) => (
                      <tr key={m.name} className="border-t border-[hsl(var(--border))] align-top">
                        <td className="px-4 py-3 font-medium">{m.name}</td>
                        <td className="px-4 py-3 text-[hsl(var(--fg-muted))]">{m.why}</td>
                        <td className="px-4 py-3 text-[hsl(var(--fg-muted))]">{m.how}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="technology" aria-labelledby="technology-h">
              <h2 id="technology-h" className={h2}>
                Technology
              </h2>
              <p className="mt-3 leading-relaxed text-[hsl(var(--fg-muted))]">{c.technology}</p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Technology tags">
                {c.technologyTags.map((t) => (
                  <li key={t} className="cx-badge">
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <aside className="cx-no-print lg:sticky lg:top-24 lg:self-start" aria-label="About this case study">
            <nav aria-label="On this page" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-4">
              <p className="cx-eyebrow">On this page</p>
              <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm lg:flex-col lg:gap-y-1.5">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} aria-current={active === t.id ? "location" : undefined} className={active === t.id ? "font-semibold text-[hsl(var(--accent))]" : "text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg))]"}>
                      {t.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <dl className="mt-4 space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-4 text-sm">
              <div>
                <dt className="text-xs text-[hsl(var(--fg-muted))]">Type</dt>
                <dd>{STATUS_LABEL[c.status]}</dd>
              </div>
              <div>
                <dt className="text-xs text-[hsl(var(--fg-muted))]">Service</dt>
                <dd>
                  <Link href={c.serviceHref} className="underline underline-offset-2 hover:text-[hsl(var(--accent))]">
                    {c.service}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[hsl(var(--fg-muted))]">Industry</dt>
                <dd>{c.industry}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className="cx-card cx-no-print mt-12" aria-labelledby="similar-h">
          <h2 id="similar-h" className="cx-display text-xl">
            Planning something similar?
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Tell CINTEXA about your project — your message starts with this case study for reference.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={similarProjectLink(c)} className="cx-btn cx-btn-primary">
              Discuss a similar project
            </Link>
            <Link href="/case-studies" className="cx-btn cx-btn-secondary">
              All case studies
            </Link>
          </div>
        </section>

        {related.length > 0 && (
          <section className="cx-no-print mt-10" aria-labelledby="more-h">
            <h2 id="more-h" className="cx-display text-lg">
              More case studies
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={caseUrlPath(r)} className="cx-card cx-card-interactive block h-full">
                    <CaseBadges c={r} />
                    <span className="mt-2 block font-semibold text-[hsl(var(--fg))]">{r.title}</span>
                    <span className="mt-1 block text-xs text-[hsl(var(--fg-muted))]">{r.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(prev || next) && (
          <nav aria-label="Other case studies" className="cx-no-print mt-8 flex flex-wrap justify-between gap-3 text-sm">
            {prev ? (
              <Link href={caseUrlPath(prev)} className="cx-btn cx-btn-secondary cx-btn-sm" rel="prev">
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={caseUrlPath(next)} className="cx-btn cx-btn-secondary cx-btn-sm" rel="next">
                {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

export default CaseStudyDetail;

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CaseCard } from "@/components/case-studies/CaseCard";
import { getCaseStudies, STATUS_LABEL } from "@/data/case-studies";
import { LIST_INTRO, caseListSeo } from "@/data/case-seo";
import {
  DEFAULT_CASE_FILTERS,
  caseFacets,
  filterCases,
  hasActiveCaseFilters,
  parseCaseFilters,
  serializeCaseFilters,
  type CaseFilters,
  type CaseSort,
} from "@/lib/case-filter";
import { applyPageSeo } from "@/lib/seo-dom";

export function CaseStudies() {
  const cases = useMemo(() => getCaseStudies(), []);
  useEffect(() => applyPageSeo(caseListSeo(cases)), [cases]);

  // Filters live in the URL (?q=…&service=…) so a filtered view can be bookmarked or shared.
  const [filters, setFilters] = useState<CaseFilters>(() =>
    typeof window === "undefined" ? DEFAULT_CASE_FILTERS : parseCaseFilters(window.location.search),
  );
  const update = useCallback((next: CaseFilters) => {
    setFilters(next);
    const { pathname, hash } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${serializeCaseFilters(next)}${hash}`);
  }, []);

  const { services, industries } = useMemo(() => caseFacets(cases), [cases]);
  const visible = useMemo(() => filterCases(cases, filters), [cases, filters]);
  const active = hasActiveCaseFilters(filters);
  const set = <K extends keyof CaseFilters>(key: K, value: CaseFilters[K]) => update({ ...filters, [key]: value });

  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">Case studies</p>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">Case studies</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--fg-muted))]">{LIST_INTRO}</p>

        {cases.length > 1 && (
          <section className="mt-8" aria-label="Search and filter case studies">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Search case studies</span>
                <input type="search" className="cx-input" placeholder="Topic, service, industry…" value={filters.q} onChange={(e) => set("q", e.target.value)} autoComplete="off" maxLength={100} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Service</span>
                <select className="cx-input" value={filters.service} onChange={(e) => set("service", e.target.value)}>
                  <option value="">All services</option>
                  {services.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.value} ({s.count})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Industry</span>
                <select className="cx-input" value={filters.industry} onChange={(e) => set("industry", e.target.value)}>
                  <option value="">All industries</option>
                  {industries.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.value} ({s.count})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
                Type
                <select className="cx-input !w-auto !py-1.5 text-sm" value={filters.status} onChange={(e) => set("status", e.target.value as CaseFilters["status"])}>
                  <option value="">All</option>
                  <option value="illustrative">{STATUS_LABEL.illustrative}</option>
                  <option value="verified">{STATUS_LABEL.verified}</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
                Sort
                <select className="cx-input !w-auto !py-1.5 text-sm" value={filters.sort} onChange={(e) => set("sort", e.target.value as CaseSort)}>
                  <option value="newest">Newest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
              {active && (
                <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => update({ ...DEFAULT_CASE_FILTERS })}>
                  Clear filters
                </button>
              )}
              <p className="ml-auto text-sm text-[hsl(var(--fg-muted))]" role="status" aria-live="polite">
                {active ? `Showing ${visible.length} of ${cases.length}` : `${cases.length} case ${cases.length === 1 ? "study" : "studies"}`}
              </p>
            </div>
          </section>
        )}

        {cases.length > 0 && visible.length === 0 && (
          <div className="cx-card mt-8 text-center">
            <p className="font-medium">No case studies match your search.</p>
            <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm mt-3" onClick={() => update({ ...DEFAULT_CASE_FILTERS })}>
              Clear filters
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <CaseCard key={c.slug} c={c} />
          ))}
        </div>

        <section className="cx-card mt-12" aria-labelledby="cs-cta">
          <h2 id="cs-cta" className="cx-display text-xl">
            Have a project requirement?
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Tell CINTEXA about it and discuss the most practical approach.</p>
          <Link href="/contact" className="cx-btn cx-btn-primary mt-4 inline-flex">
            Contact CINTEXA
          </Link>
        </section>
      </div>
    </div>
  );
}

export default CaseStudies;

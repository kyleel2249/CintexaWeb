import { STATUS_LABEL, type CaseStatus, type CaseStudy } from "@/data/case-studies";

export type CaseSort = "newest" | "title";
export type CaseFilters = { q: string; service: string; industry: string; status: "" | CaseStatus; sort: CaseSort };

export const DEFAULT_CASE_FILTERS: CaseFilters = { q: "", service: "", industry: "", status: "", sort: "newest" };

export function parseCaseFilters(search: string): CaseFilters {
  const p = new URLSearchParams(search);
  const status = p.get("status");
  const sort = p.get("sort");
  return {
    q: (p.get("q") ?? "").slice(0, 100),
    service: (p.get("service") ?? "").slice(0, 80),
    industry: (p.get("industry") ?? "").slice(0, 80),
    status: status === "illustrative" || status === "verified" ? status : "",
    sort: sort === "title" ? "title" : "newest",
  };
}

export function serializeCaseFilters(f: CaseFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.service) p.set("service", f.service);
  if (f.industry) p.set("industry", f.industry);
  if (f.status) p.set("status", f.status);
  if (f.sort !== "newest") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const hasActiveCaseFilters = (f: CaseFilters) => Boolean(f.q.trim() || f.service || f.industry || f.status);

const haystack = (c: CaseStudy) =>
  [c.title, c.summary, c.service, c.industry, c.problem, c.assessment, c.solution, c.implementation, c.technology, c.technologyTags.join(" "), STATUS_LABEL[c.status]]
    .join(" ")
    .toLowerCase();

/** Filters then sorts (stable, input not mutated). Every word typed must appear somewhere in the case. */
export function filterCases(cases: CaseStudy[], f: CaseFilters): CaseStudy[] {
  const tokens = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const out = cases
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => {
      if (f.service && c.service !== f.service) return false;
      if (f.industry && c.industry !== f.industry) return false;
      if (f.status && c.status !== f.status) return false;
      if (tokens.length) {
        const h = haystack(c);
        if (!tokens.every((t) => h.includes(t))) return false;
      }
      return true;
    });
  out.sort((a, b) =>
    f.sort === "title"
      ? a.c.title.localeCompare(b.c.title) || a.i - b.i
      : b.c.dateUpdated.localeCompare(a.c.dateUpdated) || a.i - b.i,
  );
  return out.map((x) => x.c);
}

export type CaseFacet = { value: string; count: number };

export function caseFacets(cases: CaseStudy[]): { services: CaseFacet[]; industries: CaseFacet[] } {
  const count = (pick: (c: CaseStudy) => string) => {
    const m = new Map<string, number>();
    for (const c of cases) m.set(pick(c), (m.get(pick(c)) ?? 0) + 1);
    return [...m.entries()].map(([value, n]) => ({ value, count: n })).sort((a, b) => a.value.localeCompare(b.value));
  };
  return { services: count((c) => c.service), industries: count((c) => c.industry) };
}

/** Same service first, then same industry, then the rest; never the case itself. */
export function relatedCases(c: CaseStudy, all: CaseStudy[], limit = 2): CaseStudy[] {
  const others = all.filter((x) => x.slug !== c.slug);
  const score = (x: CaseStudy) => (x.service === c.service ? 2 : 0) + (x.industry === c.industry ? 1 : 0);
  return others
    .map((x, i) => ({ x, i }))
    .sort((a, b) => score(b.x) - score(a.x) || a.i - b.i)
    .slice(0, limit)
    .map(({ x }) => x);
}

export function adjacentCases(c: CaseStudy, all: CaseStudy[]): { prev: CaseStudy | null; next: CaseStudy | null } {
  const i = all.findIndex((x) => x.slug === c.slug);
  return i === -1 ? { prev: null, next: null } : { prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}

/** Contact page URL pre-filled for "Plan something similar". */
export function similarProjectLink(c: CaseStudy): string {
  const p = new URLSearchParams({
    subject: `Project enquiry: ${c.service}`,
    message: `I read your "${c.title}" case study and would like to discuss something similar.\n\nAbout my project:\n`,
  });
  return `/contact?${p.toString()}`;
}

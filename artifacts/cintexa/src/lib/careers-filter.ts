import { employmentLabel, type JobPosting } from "@/data/jobs";

/** Pure helpers behind the careers search/filter UI, badges and "related roles". */

export type SortKey = "newest" | "closing" | "title";

export type JobFilters = {
  q: string;
  category: string;
  type: string;
  sort: SortKey;
  saved: boolean;
};

export const DEFAULT_FILTERS: JobFilters = { q: "", category: "", type: "", sort: "newest", saved: false };

const SORTS: readonly SortKey[] = ["newest", "closing", "title"];
const DAY = 86_400_000;

/** Reads filters from a query string (unknown values fall back to defaults). */
export function parseFilters(search: string): JobFilters {
  const p = new URLSearchParams(search);
  const sort = p.get("sort") as SortKey | null;
  return {
    q: (p.get("q") ?? "").slice(0, 100),
    category: (p.get("category") ?? "").slice(0, 80),
    type: (p.get("type") ?? "").slice(0, 80),
    sort: sort && SORTS.includes(sort) ? sort : "newest",
    saved: p.get("saved") === "1",
  };
}

/** "?q=cleaner&category=…" — defaults are omitted so the plain list keeps a clean URL. */
export function serializeFilters(f: JobFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.category) p.set("category", f.category);
  if (f.type) p.set("type", f.type);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.saved) p.set("saved", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const hasActiveFilters = (f: JobFilters) =>
  Boolean(f.q.trim() || f.category || f.type || f.saved);

const utcDay = (iso: string) => {
  const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
};
const todayUtc = (now: Date) => Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

function haystack(job: JobPosting): string {
  return [
    job.title,
    job.role,
    job.employerName,
    job.category,
    job.industry,
    job.location,
    job.summary,
    job.requirements.join(" "),
    job.responsibilities.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Filters, then sorts (stable). Every word typed must appear somewhere in the vacancy. */
export function filterJobs(jobs: JobPosting[], f: JobFilters, saved: ReadonlySet<string> = new Set()): JobPosting[] {
  const tokens = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const out = jobs
    .map((job, index) => ({ job, index }))
    .filter(({ job }) => {
      if (f.category && job.category !== f.category) return false;
      if (f.type && employmentLabel(job) !== f.type) return false;
      if (f.saved && !saved.has(job.slug)) return false;
      if (tokens.length) {
        const h = haystack(job);
        if (!tokens.every((t) => h.includes(t))) return false;
      }
      return true;
    });

  out.sort((a, b) => {
    if (f.sort === "title") return a.job.title.localeCompare(b.job.title) || a.index - b.index;
    if (f.sort === "closing") {
      const ea = a.job.validThrough ? (utcDay(a.job.validThrough) ?? Infinity) : Infinity;
      const eb = b.job.validThrough ? (utcDay(b.job.validThrough) ?? Infinity) : Infinity;
      if (ea !== eb) return ea < eb ? -1 : 1;
    }
    return b.job.datePosted.localeCompare(a.job.datePosted) || a.index - b.index;
  });
  return out.map((x) => x.job);
}

export type Facet = { value: string; count: number };

/** Category and employment-type options with how many vacancies each has. */
export function facets(jobs: JobPosting[]): { categories: Facet[]; types: Facet[] } {
  const count = (pick: (j: JobPosting) => string | undefined) => {
    const m = new Map<string, number>();
    for (const j of jobs) {
      const v = pick(j);
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].map(([value, c]) => ({ value, count: c })).sort((a, b) => a.value.localeCompare(b.value));
  };
  return { categories: count((j) => j.category), types: count((j) => employmentLabel(j)) };
}

/** Whole days since the vacancy was posted (0 = today, never negative). */
export function daysSincePosted(job: JobPosting, now: Date = new Date()): number {
  const posted = utcDay(job.datePosted);
  return posted === null ? 0 : Math.max(0, Math.floor((todayUtc(now) - posted) / DAY));
}

export function postedLabel(job: JobPosting, now: Date = new Date()): string {
  const d = daysSincePosted(job, now);
  if (d === 0) return "Posted today";
  if (d === 1) return "Posted yesterday";
  if (d < 14) return `Posted ${d} days ago`;
  if (d < 60) return `Posted ${Math.floor(d / 7)} weeks ago`;
  return `Posted ${Math.floor(d / 30)} months ago`;
}

/** Days left to apply (0 = last day), or null when the vacancy has no closing date. */
export function daysUntilClose(job: JobPosting, now: Date = new Date()): number | null {
  if (!job.validThrough) return null;
  const end = utcDay(job.validThrough);
  return end === null ? null : Math.floor((end - todayUtc(now)) / DAY);
}

export function closesLabel(job: JobPosting, now: Date = new Date()): string | null {
  const d = daysUntilClose(job, now);
  if (d === null || d < 0) return null;
  if (d === 0) return "Closes today";
  if (d === 1) return "Closes tomorrow";
  return `Closes in ${d} days`;
}

export const isNew = (job: JobPosting, now: Date = new Date(), days = 7) => daysSincePosted(job, now) < days;

export function isClosingSoon(job: JobPosting, now: Date = new Date(), days = 14): boolean {
  const d = daysUntilClose(job, now);
  return d !== null && d >= 0 && d <= days;
}

/** Same-category roles first, then the newest others; never the job itself. */
export function relatedJobs(job: JobPosting, all: JobPosting[], limit = 3): JobPosting[] {
  const others = all.filter((j) => j.slug !== job.slug);
  const same = others.filter((j) => job.category && j.category === job.category);
  const rest = others.filter((j) => !same.includes(j));
  return [...same, ...rest].slice(0, limit);
}

/** Neighbours in a (newest-first) list, for previous/next links. */
export function adjacentJobs(job: JobPosting, all: JobPosting[]): { prev: JobPosting | null; next: JobPosting | null } {
  const i = all.findIndex((j) => j.slug === job.slug);
  if (i === -1) return { prev: null, next: null };
  return { prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}

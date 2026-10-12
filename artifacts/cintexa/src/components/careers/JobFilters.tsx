import type { Facet, JobFilters as Filters, SortKey } from "@/lib/careers-filter";
import { DEFAULT_FILTERS, hasActiveFilters } from "@/lib/careers-filter";

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  categories: Facet[];
  types: Facet[];
  savedCount: number;
  total: number;
  shown: number;
};

const SORT_LABEL: Record<SortKey, string> = {
  newest: "Newest first",
  closing: "Closing soonest",
  title: "Title A–Z",
};

/** Search, filter and sort controls for the vacancy list. */
export function JobFilters({ filters, onChange, categories, types, savedCount, total, shown }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });
  const active = hasActiveFilters(filters);

  return (
    <section className="mt-8" aria-label="Search and filter vacancies">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Search vacancies</span>
          <input
            type="search"
            className="cx-input"
            placeholder="Role, employer, location…"
            value={filters.q}
            onChange={(e) => set("q", e.target.value)}
            autoComplete="off"
            maxLength={100}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Category</span>
          <select className="cx-input" value={filters.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value} ({c.count})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Type</span>
          <select className="cx-input" value={filters.type} onChange={(e) => set("type", e.target.value)}>
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.value} ({t.count})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
          Sort
          <select className="cx-input !w-auto !py-1.5 text-sm" value={filters.sort} onChange={(e) => set("sort", e.target.value as SortKey)}>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="cx-btn cx-btn-secondary cx-btn-sm"
          aria-pressed={filters.saved}
          onClick={() => set("saved", !filters.saved)}
        >
          <span aria-hidden>{filters.saved ? "♥" : "♡"}</span> Saved ({savedCount})
        </button>
        {active && (
          <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => onChange({ ...DEFAULT_FILTERS })}>
            Clear filters
          </button>
        )}
        <p className="ml-auto text-sm text-[hsl(var(--fg-muted))]" role="status" aria-live="polite">
          {active ? `Showing ${shown} of ${total} ${total === 1 ? "vacancy" : "vacancies"}` : `${total} open ${total === 1 ? "vacancy" : "vacancies"}`}
        </p>
      </div>
    </section>
  );
}

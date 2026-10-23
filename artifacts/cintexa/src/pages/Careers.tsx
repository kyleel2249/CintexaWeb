import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AdSenseInContent } from "@/components/ads/AdSenseSlot";
import { CampaignCard } from "@/components/careers/CampaignCard";
import { JobAlertForm } from "@/components/careers/JobAlertForm";
import { JobCard } from "@/components/careers/JobCard";
import { JobFilters } from "@/components/careers/JobFilters";
import { CAMPAIGNS } from "@/data/campaigns";
import { getOpenJobs } from "@/data/jobs";
import { careersListSeo } from "@/data/careers-seo";
import { DEFAULT_FILTERS, facets, filterJobs, parseFilters, serializeFilters, type JobFilters as Filters } from "@/lib/careers-filter";
import { useSavedJobs } from "@/lib/saved-jobs";
import { applyPageSeo } from "@/lib/seo-dom";
import { useNow } from "@/lib/use-now";

export function Careers() {
  const now = useNow();
  // Current vacancies, newest first. Title, description, preview image, Open Graph, Twitter card
  // and JSON-LD are all derived from this list, so they change whenever the vacancies do.
  const jobs = useMemo(() => getOpenJobs(), []);
  useEffect(() => applyPageSeo(careersListSeo(jobs)), [jobs]);

  // Filters live in the URL (?q=…&category=…) so a filtered view can be bookmarked or shared.
  const [filters, setFilters] = useState<Filters>(() =>
    typeof window === "undefined" ? DEFAULT_FILTERS : parseFilters(window.location.search),
  );
  const updateFilters = useCallback((next: Filters) => {
    setFilters(next);
    const { pathname, hash } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${serializeFilters(next)}${hash}`);
  }, []);

  const { slugs: savedSlugs } = useSavedJobs();
  const saved = useMemo(() => new Set(savedSlugs), [savedSlugs]);
  const { categories, types } = useMemo(() => facets(jobs), [jobs]);
  const visible = useMemo(() => filterJobs(jobs, filters, saved), [jobs, filters, saved]);
  // Multi-vacancy campaigns stay listed (open or closed) and match a search on the employer or any role.
  const campaigns = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return CAMPAIGNS.filter(
      (c) => !q || [c.employerName, c.badge, ...c.roles.map((r) => r.title)].join(" ").toLowerCase().includes(q),
    );
  }, [filters.q]);

  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">Careers · Jobs · Scholarships</p>
        <h1 className="cx-display mt-3 max-w-3xl text-3xl sm:text-4xl">Careers & Job Vacancies in Ghana — Apply Now</h1>

        {jobs.length > 0 && (
          <JobFilters
            filters={filters}
            onChange={updateFilters}
            categories={categories}
            types={types}
            savedCount={savedSlugs.filter((s) => jobs.some((j) => j.slug === s)).length}
            total={jobs.length}
            shown={visible.length}
          />
        )}

        {jobs.length === 0 && (
          <p className="mt-10 text-[hsl(var(--fg-muted))]">
            There are no open vacancies right now. Sign up below and we will email you when new roles are posted.
          </p>
        )}

        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} now={now} />
        ))}

        {jobs.length > 0 && visible.length === 0 && campaigns.length === 0 && (
          <div className="cx-card mt-8 text-center">
            <p className="font-medium">No vacancies match your search.</p>
            <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm mt-3" onClick={() => updateFilters({ ...DEFAULT_FILTERS })}>
              Clear filters
            </button>
          </div>
        )}

        {visible.map((job) => (
          <JobCard key={job.id} job={job} now={now} />
        ))}

        {jobs.some((j) => j.slug === "cleaner") && !filters.q && (
          <p className="mt-4 max-w-2xl text-[hsl(var(--fg-muted))]">
            Reliable <strong className="text-[hsl(var(--fg))]">Cleaners</strong> are needed for{" "}
            <strong className="text-[hsl(var(--fg))]">homes, offices, churches</strong>, schools and other premises. If you
            take pride in clean, hygienic spaces and you are available and dedicated, you are invited to apply today.
          </p>
        )}

        <AdSenseInContent />

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {jobs.some((j) => j.slug === "cleaner") && (
              <div className="cx-card">
                <p className="cx-eyebrow">Why these roles matter</p>
                <h2 className="cx-display mt-2 text-xl">Clean spaces support homes and communities</h2>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                  Clean, well-kept homes, offices, churches and public spaces help families, staff and visitors stay
                  comfortable and focused. As Cleaners you set that standard every day, wherever the assignment is.
                </p>
              </div>
            )}
            <div className="cx-card">
              <p className="cx-eyebrow">Follow new vacancies</p>
              <h2 className="cx-display mt-2 text-xl">Stay informed</h2>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                Sign up for alerts, or follow the vacancy feed in your reader. Each vacancy has its own page you can
                bookmark and share.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/careers/feed.xml" className="cx-btn cx-btn-secondary cx-btn-sm">
                  Vacancy feed (RSS)
                </a>
                <Link href="/dashboard/careers" className="cx-btn cx-btn-secondary cx-btn-sm">
                  Saved jobs in dashboard
                </Link>
              </div>
            </div>
          </div>

          <JobAlertForm />
        </div>

        <p className="mt-10 text-xs text-[hsl(var(--fg-muted))]">
          General enquiries{" "}
          <a href="mailto:info@cintexa.com" className="underline hover:text-[hsl(var(--fg))]">
            info@cintexa.com
          </a>
        </p>
      </div>
    </div>
  );
}

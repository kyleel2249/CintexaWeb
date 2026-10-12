import { Link } from "wouter";
import { DashboardShell } from "./DashboardShell";
import { JobBadges } from "@/components/careers/JobBadges";
import { SaveJobButton } from "@/components/careers/SaveJobButton";
import { employmentLabel, getOpenJobs, type JobPosting } from "@/data/jobs";
import scholarshipData from "@/data/scholarships.json";
import { useSavedJobs } from "@/lib/saved-jobs";
import { useNow } from "@/lib/use-now";

export type Scholarship = { id: string; title: string; level: string; summary: string; status: string; url?: string };
const SCHOLARSHIPS = scholarshipData as Scholarship[];

function JobRow({ job, now }: { job: JobPosting; now: Date }) {
  return (
    <article className="cx-card flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" aria-labelledby={`dash-${job.slug}`}>
      <div className="min-w-0">
        <JobBadges job={job} now={now} />
        <h4 id={`dash-${job.slug}`} className="mt-2 font-semibold text-[hsl(var(--fg))]">
          <Link href={`/careers/${job.slug}`} className="hover:underline">
            {job.title}
          </Link>
        </h4>
        <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
          {job.employerName ? `${job.employerName} · ` : ""}
          {job.location} · {employmentLabel(job)}
        </p>
        <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{job.summary}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link href={`/careers/${job.slug}`} className="cx-btn cx-btn-primary cx-btn-sm">
          View role
        </Link>
        <SaveJobButton job={job} />
      </div>
    </article>
  );
}

export function DashboardCareers() {
  const now = useNow();
  const jobs = getOpenJobs(now);
  const { slugs } = useSavedJobs();
  const saved = slugs.map((s) => jobs.find((j) => j.slug === s)).filter((j): j is JobPosting => Boolean(j));

  return (
    <DashboardShell>
      <div className="space-y-10">
        <div>
          <p className="cx-eyebrow">Portal · Opportunities</p>
          <h2 className="cx-display mt-2 text-2xl">Careers & scholarships</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/careers" className="cx-btn cx-btn-primary cx-btn-sm">
              All vacancies & alerts
            </Link>
            <a href="mailto:info@cintexa.com?subject=Career%20application" className="cx-btn cx-btn-secondary cx-btn-sm">
              Email applications
            </a>
          </div>
        </div>

        {saved.length > 0 && (
          <section aria-labelledby="saved-title">
            <h3 id="saved-title" className="cx-display text-lg">
              Saved jobs ({saved.length})
            </h3>
            <div className="mt-4 grid gap-3">
              {saved.map((job) => (
                <JobRow key={job.slug} job={job} now={now} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="jobs-title">
          <h3 id="jobs-title" className="cx-display text-lg">
            Open vacancies
          </h3>
          {jobs.length === 0 ? (
            <p className="mt-4 text-sm text-[hsl(var(--fg-muted))]">
              There are no open vacancies right now.{" "}
              <Link href="/careers" className="underline">
                Sign up for alerts
              </Link>{" "}
              and we’ll email you when new roles are posted.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {jobs.map((job) => (
                <JobRow key={job.slug} job={job} now={now} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="scholarships-title">
          <h3 id="scholarships-title" className="cx-display text-lg">
            Scholarships
          </h3>
          {SCHOLARSHIPS.length === 0 ? (
            <p className="mt-4 text-sm text-[hsl(var(--fg-muted))]">
              No scholarship programmes are open right now.{" "}
              <Link href="/careers" className="underline">
                Get alerts
              </Link>{" "}
              for new ones.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {SCHOLARSHIPS.map((s) => (
                <article key={s.id} className="cx-card flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-[hsl(var(--fg))]">{s.url ? <a href={s.url} className="hover:underline">{s.title}</a> : s.title}</h4>
                    <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{s.level}</p>
                    <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.summary}</p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "hsl(var(--accent))" }}>
                    {s.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

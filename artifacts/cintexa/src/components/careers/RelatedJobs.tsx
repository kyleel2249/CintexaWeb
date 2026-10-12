import { Link } from "wouter";
import { employmentLabel, type JobPosting } from "@/data/jobs";
import { adjacentJobs, relatedJobs } from "@/lib/careers-filter";
import { JobBadges } from "./JobBadges";

/** "More vacancies" — each one links to its own page. */
export function RelatedJobs({ job, jobs, now }: { job: JobPosting; jobs: JobPosting[]; now: Date }) {
  const related = relatedJobs(job, jobs, 3);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="mt-10">
      <h2 id="related-title" className="cx-display text-lg">
        More vacancies
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {related.map((j) => (
          <li key={j.slug}>
            <Link href={`/careers/${j.slug}`} className="cx-card cx-card-interactive block h-full">
              <JobBadges job={j} now={now} />
              <span className="mt-2 block font-semibold text-[hsl(var(--fg))]">{j.title}</span>
              <span className="mt-1 block text-xs text-[hsl(var(--fg-muted))]">
                {j.employerName ? `${j.employerName} · ` : ""}
                {j.location} · {employmentLabel(j)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Previous / next vacancy, in the order shown on /careers. */
export function JobNav({ job, jobs }: { job: JobPosting; jobs: JobPosting[] }) {
  const { prev, next } = adjacentJobs(job, jobs);
  if (!prev && !next) return null;
  return (
    <nav aria-label="Other vacancies" className="mt-8 flex flex-wrap justify-between gap-3 text-sm">
      {prev ? (
        <Link href={`/careers/${prev.slug}`} className="cx-btn cx-btn-secondary cx-btn-sm" rel="prev">
          ← {prev.role}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/careers/${next.slug}`} className="cx-btn cx-btn-secondary cx-btn-sm" rel="next">
          {next.role} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

import { employmentLabel, type JobPosting } from "@/data/jobs";
import { closesLabel, isClosingSoon, isNew, postedLabel } from "@/lib/careers-filter";

/** Status chips for a vacancy: New, Closing soon, how long ago, closing date, type. */
export function JobBadges({ job, now }: { job: JobPosting; now: Date }) {
  const closes = closesLabel(job, now);
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Vacancy details">
      {isNew(job, now) && (
        <li>
          <span className="cx-badge cx-badge-success">New</span>
        </li>
      )}
      {isClosingSoon(job, now) && (
        <li>
          <span className="cx-badge cx-badge-warning">Closing soon</span>
        </li>
      )}
      <li>
        <span className="cx-badge">{employmentLabel(job)}</span>
      </li>
      {job.category && (
        <li>
          <span className="cx-badge">{job.category}</span>
        </li>
      )}
      <li className="text-xs text-[hsl(var(--fg-muted))]">{postedLabel(job, now)}</li>
      {closes && <li className="text-xs text-[hsl(var(--fg-muted))]">· {closes}</li>}
    </ul>
  );
}

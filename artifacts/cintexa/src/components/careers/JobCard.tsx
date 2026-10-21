import { Link } from "wouter";
import { employmentLabel, jobWhatsAppUrl, type JobPosting } from "@/data/jobs";
import { JobBadges } from "./JobBadges";
import { JobShare } from "./JobShare";
import { SaveJobButton } from "./SaveJobButton";

/** One vacancy on the /careers list. Each card links to that vacancy's own page (/careers/<slug>). */
export function JobCard({ job, now }: { job: JobPosting; now: Date }) {
  const href = `/careers/${job.slug}`;
  const portrait = job.socialImageHeight > job.socialImageWidth * 1.1;
  const wa = jobWhatsAppUrl(job);
  return (
    <article
      id={job.slug}
      className="mt-8 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))]"
      aria-labelledby={`${job.slug}-title`}
    >
      <div className="grid gap-0 lg:grid-cols-2">
        <Link href={href} className="relative block bg-[hsl(var(--bg))]" tabIndex={-1} aria-hidden>
          <div className={`relative ${portrait ? "min-h-[320px]" : "min-h-[280px]"} h-full`}>
            <img
              src={job.image}
              alt=""
              className={`absolute inset-0 h-full w-full ${portrait ? "object-contain" : "object-cover"}`}
              loading="lazy"
              decoding="async"
            />
          </div>
        </Link>
        <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
          <JobBadges job={job} now={now} />
          <h2 id={`${job.slug}-title`} className="cx-display text-2xl sm:text-3xl">
            <Link href={href} className="hover:underline">
              {job.title}
            </Link>
          </h2>
          <p className="text-sm text-[hsl(var(--fg-muted))]">
            <strong className="text-[hsl(var(--fg))]">{job.role}</strong>
            {job.employerName ? <> · {job.employerName}</> : null}
            {" · "}
            {job.location}
            {" · "}
            {employmentLabel(job)}
          </p>
          <p className="text-base font-medium leading-relaxed text-[hsl(var(--fg))]">{job.summary}</p>
          <p className="text-sm leading-relaxed text-[hsl(var(--fg-muted))]">{job.description}</p>

          <div>
            <h3 className="font-semibold text-[hsl(var(--fg))]">What you’ll do</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
              {job.responsibilities.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(var(--fg))]">Who should apply?</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
              {job.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[hsl(var(--border))] pt-4">
            <Link href={href} className="cx-btn cx-btn-primary cx-btn-sm">
              View role & apply
            </Link>
            <SaveJobButton job={job} />
          </div>
          <JobShare job={job} compact />

          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4">
            <p className="text-sm font-medium text-[hsl(var(--fg))]">{wa ? "Interested? Call or WhatsApp now" : "Interested? Call now"}</p>
            {job.applyNote && <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{job.applyNote}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${job.applyPhone}`} className="cx-btn cx-btn-secondary cx-btn-sm">
                Call {job.applyPhoneDisplay}
              </a>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="cx-btn cx-btn-secondary cx-btn-sm">
                  WhatsApp {job.applyPhoneDisplay}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

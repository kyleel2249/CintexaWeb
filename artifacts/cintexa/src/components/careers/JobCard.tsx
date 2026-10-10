import { Link } from "wouter";
import { employmentLabel, jobWhatsAppUrl, type JobPosting } from "@/data/jobs";

/** One vacancy on the /careers list. Everything shown comes from the job record. */
export function JobCard({ job }: { job: JobPosting }) {
  const href = `/careers/${job.slug}`;
  const portrait = job.socialImageHeight > job.socialImageWidth * 1.1;
  return (
    <article
      id={job.slug}
      className="mt-10 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))]"
    >
      <div className="grid gap-0 lg:grid-cols-2">
        <div className={`relative bg-[hsl(var(--bg))] ${portrait ? "min-h-[320px]" : "min-h-[280px]"}`}>
          <img
            src={job.image}
            alt={job.imageAlt ?? `${job.role} job vacancy — ${job.location}`}
            className={`absolute inset-0 h-full w-full ${portrait ? "object-contain" : "object-cover"}`}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>
            Open role{job.category ? ` · ${job.category}` : ""} · Apply now
          </p>
          <h2 className="cx-display mt-2 text-2xl sm:text-3xl">
            <Link href={href} className="hover:underline">
              {job.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
            Title / Role: <strong className="text-[hsl(var(--fg))]">{job.role}</strong>
            {job.employerName ? <> · {job.employerName}</> : null}
            {" · "}
            {job.location}
            {" · "}
            {employmentLabel(job)}
            {" · "}
            <Link href={href} className="underline" style={{ color: "hsl(var(--accent))" }}>
              Full details
            </Link>
          </p>
          <p className="mt-3 text-base font-medium leading-relaxed text-[hsl(var(--fg))]">{job.summary}</p>
          <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--fg-muted))]">{job.description}</p>

          <h3 className="mt-5 font-semibold text-[hsl(var(--fg))]">What you’ll do</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
            {job.responsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h3 className="mt-5 font-semibold text-[hsl(var(--fg))]">Who should apply?</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4">
            <p className="text-sm font-medium text-[hsl(var(--fg))]">Interested? Call or WhatsApp now</p>
            {job.applyNote && <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{job.applyNote}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${job.applyPhone}`} className="cx-btn cx-btn-secondary cx-btn-sm">
                Call {job.applyPhoneDisplay}
              </a>
              <a
                href={jobWhatsAppUrl(job)}
                target="_blank"
                rel="noopener noreferrer"
                className="cx-btn cx-btn-primary cx-btn-sm"
              >
                WhatsApp {job.applyPhoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

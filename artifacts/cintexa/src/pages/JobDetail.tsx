import { useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { employmentLabel, getJobBySlug, getOpenJobs, jobWhatsAppUrl } from "@/data/jobs";
import { jobNotFoundSeo, jobSeo } from "@/data/careers-seo";
import { applyPageSeo } from "@/lib/seo-dom";
import { useNow } from "@/lib/use-now";
import { ApplyForm } from "@/components/careers/ApplyForm";
import { JobBadges } from "@/components/careers/JobBadges";
import { JobNav, RelatedJobs } from "@/components/careers/RelatedJobs";
import { JobShare } from "@/components/careers/JobShare";
import { SaveJobButton } from "@/components/careers/SaveJobButton";

export function JobDetail() {
  const params = useParams<{ id: string }>();
  const slug = params.id ?? "";
  const job = useMemo(() => getJobBySlug(slug), [slug]);
  const openJobs = useMemo(() => getOpenJobs(), []);
  const now = useNow();

  // Every head tag (title, description, canonical, robots, Open Graph, Twitter, JSON-LD) comes from
  // the job record, so the link preview always matches the vacancy shown on this page.
  useEffect(() => applyPageSeo(job ? jobSeo(job) : jobNotFoundSeo()), [job]);

  if (!job) {
    return (
      <div className="cx-section">
        <div className="cx-container max-w-xl">
          <p className="cx-eyebrow">Careers</p>
          <h1 className="cx-display mt-3 text-3xl">Role not found</h1>
          <p className="mt-3 text-[hsl(var(--fg-muted))]">This vacancy may have closed or the link is incorrect.</p>
          <Link href="/careers" className="cx-btn cx-btn-primary mt-6 inline-flex">
            View open roles
          </Link>
        </div>
      </div>
    );
  }

  const wa = jobWhatsAppUrl(job);

  return (
    <div className="cx-section">
      <div className="cx-container max-w-3xl">
        <nav aria-label="Breadcrumb" className="cx-no-print text-xs text-[hsl(var(--fg-muted))]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[hsl(var(--fg))]">
                Home
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/careers" className="hover:text-[hsl(var(--fg))]">
                Careers
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-[hsl(var(--fg))]">
              {job.role}
            </li>
          </ol>
        </nav>

        <div className="mt-4">
          <JobBadges job={job} now={now} />
        </div>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">{job.title}</h1>
        <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
          <strong className="text-[hsl(var(--fg))]">{job.role}</strong>
          {job.employerName ? <> · {job.employerName}</> : null}
          {" · "}
          {job.location}
          {" · "}
          {employmentLabel(job)}
        </p>

        <div className="cx-no-print mt-4 flex flex-wrap items-center gap-2">
          <a href="#apply" className="cx-btn cx-btn-primary cx-btn-sm">
            Apply now
          </a>
          <SaveJobButton job={job} />
          <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => window.print()}>
            Print
          </button>
        </div>
        <div className="cx-no-print mt-3">
          <JobShare job={job} />
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
          <img
            src={job.image}
            alt={job.imageAlt ?? `${job.role} job vacancy — ${job.location}`}
            width={job.socialImageWidth}
            height={job.socialImageHeight}
            className={
              job.socialImageHeight > job.socialImageWidth * 1.1
                ? "mx-auto max-h-[720px] w-full object-contain"
                : "aspect-[16/10] w-full object-cover"
            }
          />
        </div>

        <div className="prose-invert mt-8 space-y-4 text-[hsl(var(--fg-muted))]">
          <p className="text-base leading-relaxed text-[hsl(var(--fg))]">{job.summary}</p>
          <p className="text-sm leading-relaxed">{job.description}</p>
          <h2 className="cx-display text-lg text-[hsl(var(--fg))]">What you’ll do</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {job.responsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h2 className="cx-display text-lg text-[hsl(var(--fg))]">Requirements</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-6">
          <p className="text-sm font-medium text-[hsl(var(--fg))]">Prefer to call or WhatsApp?</p>
          {job.applyNote && <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{job.applyNote}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${job.applyPhone}`} className="cx-btn cx-btn-secondary cx-btn-sm">
              Call {job.applyPhoneDisplay}
            </a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="cx-btn cx-btn-secondary cx-btn-sm">
              WhatsApp {job.applyPhoneDisplay}
            </a>
          </div>
        </div>

        <div className="cx-no-print mt-8">
          <ApplyForm job={job} />
        </div>

        <div className="cx-no-print">
          <RelatedJobs job={job} jobs={openJobs} now={now} />
          <JobNav job={job} jobs={openJobs} />
          <p className="mt-8 text-xs text-[hsl(var(--fg-muted))]">
            <Link href="/careers" className="underline hover:text-[hsl(var(--fg))]">
              All vacancies & alerts
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default JobDetail;

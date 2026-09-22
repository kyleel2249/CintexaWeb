import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { getJobBySlug, jobPostingJsonLd, jobWhatsAppUrl } from "@/data/jobs";

export function JobDetail() {
  const params = useParams<{ id: string }>();
  const slug = params.id ?? "";
  const job = getJobBySlug(slug);

  useEffect(() => {
    if (!job) {
      document.title = "Job not found | Careers";
      return;
    }
    document.title = job.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", job.summary);

    const scriptId = "jobposting-jsonld";
    document.getElementById(scriptId)?.remove();
    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(
      jobPostingJsonLd(job, `https://cintexa.com/careers/${job.slug}`),
    );
    document.head.appendChild(script);
  }, [job]);

  if (!job) {
    return (
      <div className="cx-section">
        <div className="cx-container max-w-xl">
          <p className="cx-eyebrow">Careers</p>
          <h1 className="cx-display mt-3 text-3xl">Role not found</h1>
          <p className="mt-3 text-[hsl(var(--fg-muted))]">
            This vacancy may have closed or the link is incorrect.
          </p>
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
        <p className="cx-eyebrow">
          <Link href="/careers" className="hover:text-[hsl(var(--fg))]">
            Careers
          </Link>{" "}
          · Open role
        </p>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">{job.title}</h1>
        <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
          Title / Role: <strong className="text-[hsl(var(--fg))]">{job.role}</strong>
          {" · "}
          {job.location}
          {" · "}
          {job.employmentType.replace("_", " ")}
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[hsl(var(--border))]">
          <img
            src={job.image}
            alt={`${job.role} job vacancy — ${job.location}`}
            className="aspect-[16/10] w-full object-cover"
          />
        </div>

        <div className="prose-invert mt-8 space-y-4 text-[hsl(var(--fg-muted))]">
          <p className="text-base leading-relaxed text-[hsl(var(--fg))]">{job.summary}</p>
          <p className="text-sm leading-relaxed">{job.description}</p>
          <h2 className="cx-display text-lg text-[hsl(var(--fg))]">Requirements</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-6">
          <p className="text-sm font-medium text-[hsl(var(--fg))]">Interested? Call or WhatsApp now</p>
          <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
            Call or message for application steps, location, and start date.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${job.applyPhone}`} className="cx-btn cx-btn-secondary cx-btn-sm">
              Call {job.applyPhoneDisplay}
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="cx-btn cx-btn-primary cx-btn-sm"
            >
              WhatsApp {job.applyPhoneDisplay}
            </a>
          </div>
        </div>

        <p className="mt-8 text-xs text-[hsl(var(--fg-muted))]">
          <Link href="/careers" className="underline hover:text-[hsl(var(--fg))]">
            All careers & alerts
          </Link>
        </p>
      </div>
    </div>
  );
}

export default JobDetail;

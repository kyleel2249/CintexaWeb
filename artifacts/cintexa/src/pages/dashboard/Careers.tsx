import { Link } from "wouter";
import { DashboardShell } from "./DashboardShell";

/** Sample listings for the portal. Replace with live data from the API when available. */
const JOBS = [
  {
    id: "j0",
    title: "Cleaner",
    type: "Full-time",
    location: "Ghana",
    summary: "Available and dedicated cleaner for CINTEXA workspaces. Call or WhatsApp +233 59 516 8610.",
    status: "Open",
  },

  {
    id: "j1",
    title: "Frontend Engineer (React)",
    type: "Full-time",
    location: "Remote / Accra",
    summary: "Build product surfaces for the CINTEXA growth platform.",
    status: "Open",
  },
  {
    id: "j2",
    title: "Growth Marketing Associate",
    type: "Full-time",
    location: "Hybrid",
    summary: "Campaigns, content, and funnel experiments across Ads Boost and e-commerce.",
    status: "Open",
  },
  {
    id: "j3",
    title: "Customer Success Intern",
    type: "Internship",
    location: "Accra",
    summary: "Support onboarding and dashboard adoption for new accounts.",
    status: "Open",
  },
] as const;

const SCHOLARSHIPS = [
  {
    id: "s1",
    title: "Digital Skills Scholarship",
    level: "Undergraduate / early career",
    summary: "Support for learners building software, web, and data skills.",
    status: "Applications open",
  },
  {
    id: "s2",
    title: "Women in Technology Award",
    level: "All levels",
    summary: "Mentorship and stipend for women advancing in technology careers.",
    status: "Coming soon",
  },
] as const;

export function DashboardCareers() {
  return (
    <DashboardShell>
      <div className="space-y-10">
        <div>
          <p className="cx-eyebrow">Portal · Opportunities</p>
          <h2 className="cx-display mt-2 text-2xl">Careers & scholarships</h2>
          <p className="mt-2 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
            Browse listed roles and scholarship programmes. Sign up on the public Careers page to
            get email alerts when new opportunities are posted.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/careers" className="cx-btn cx-btn-primary cx-btn-sm">
              Job alert signup
            </Link>
            <a href="mailto:info@cintexa.com?subject=Career%20application" className="cx-btn cx-btn-secondary cx-btn-sm">
              Email applications
            </a>
          </div>
        </div>

        <section>
          <h3 className="cx-display text-lg">Jobs</h3>
          <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
            Sample listings for demonstration — confirm with CINTEXA before applying as final.
          </p>
          <div className="mt-4 grid gap-3">
            {JOBS.map((job) => (
              <article key={job.id} className="cx-card flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-[hsl(var(--fg))]">{job.title}</h4>
                    <span className="cx-badge">{job.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{job.location}</p>
                  <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{job.summary}</p>
                </div>
                <span className="text-xs font-medium" style={{ color: "hsl(var(--accent))" }}>
                  {job.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h3 className="cx-display text-lg">Scholarships</h3>
          <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
            Sample programmes — details and eligibility are confirmed by the CINTEXA team.
          </p>
          <div className="mt-4 grid gap-3">
            {SCHOLARSHIPS.map((s) => (
              <article key={s.id} className="cx-card flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-semibold text-[hsl(var(--fg))]">{s.title}</h4>
                  <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{s.level}</p>
                  <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.summary}</p>
                </div>
                <span className="text-xs font-medium" style={{ color: "hsl(var(--accent))" }}>
                  {s.status}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

import { Link } from "wouter";
import { SolutionPageShell } from "@/pages/SolutionPageShell";

const CAPABILITIES = [
  {
    title: "Custom business software",
    copy: "Systems designed around your processes—inventory, operations, CRM extensions, internal tools, and domain-specific workflows.",
  },
  {
    title: "Apps for teams and customers",
    copy: "Desktop and mobile-oriented applications that fit how your staff and customers actually work day to day.",
  },
  {
    title: "APIs and integrations",
    copy: "Connect new software to existing platforms, payment providers, analytics, and third-party services with clean interfaces.",
  },
  {
    title: "Automation & reliability",
    copy: "Reduce repetitive work with automated pipelines, scheduled jobs, and monitored production systems.",
  },
];

const OUTCOMES = [
  "Software matched to your specifications—not a generic template",
  "Clear ownership of requirements, delivery milestones, and quality",
  "Architecture that can grow with your business",
  "Documentation and handover so your team stays in control",
];

export function SoftwareDev() {
  return (
    <SolutionPageShell
      eyebrow="Solutions · Software development"
      title="Custom software and apps for your business specifications"
      intro="We design and build custom software and applications that suit your business needs—from internal operations tools to customer-facing systems—aligned to your requirements, timelines, and growth plans."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CAPABILITIES.map((c) => (
          <div key={c.title} className="cx-card">
            <h3 className="cx-display text-lg">{c.title}</h3>
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{c.copy}</p>
          </div>
        ))}
      </div>

      <div className="cx-card mt-10">
        <p className="cx-eyebrow">What you can expect</p>
        <ul className="mt-4 space-y-2">
          {OUTCOMES.map((o) => (
            <li key={o} className="flex gap-2 text-sm text-[hsl(var(--fg-muted))]">
              <span style={{ color: "hsl(var(--accent))" }} aria-hidden>
                →
              </span>
              {o}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/contact" className="cx-btn cx-btn-primary cx-btn-lg">
          Talk about your project
        </Link>
        <Link href="/solutions/website-development" className="cx-btn cx-btn-secondary cx-btn-lg">
          Website development
        </Link>
      </div>
    </SolutionPageShell>
  );
}

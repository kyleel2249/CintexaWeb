import { Link } from "wouter";
import { SolutionPageShell } from "@/pages/SolutionPageShell";

const CAPABILITIES = [
  {
    title: "Custom business websites",
    copy: "Marketing sites, product pages, and customer portals built to your brand, goals, and technical requirements.",
  },
  {
    title: "Web applications",
    copy: "Secure, scalable web apps for internal teams and external customers—dashboards, booking, portals, and workflows.",
  },
  {
    title: "Mobile-ready experiences",
    copy: "Responsive and progressive web experiences so customers and staff can work from any device.",
  },
  {
    title: "Integrations",
    copy: "Connect payments, CRM, analytics, email, and existing systems so your website works as part of the business—not a silo.",
  },
];

const PROCESS = [
  { step: "01", title: "Discover", copy: "We document your business needs, users, and success metrics." },
  { step: "02", title: "Design & build", copy: "UI, architecture, and implementation matched to your specifications." },
  { step: "03", title: "Launch & support", copy: "Deploy, train your team, and iterate as the business grows." },
];

export function WebsiteDev() {
  return (
    <SolutionPageShell
      eyebrow="Solutions · Website development"
      title="Custom Website Development & High-Performance Web Apps"
      intro="We create custom websites and web applications tailored to your business needs and specifications—from first impression to conversion, operations, and growth."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CAPABILITIES.map((c) => (
          <div key={c.title} className="cx-card">
            <h3 className="cx-display text-lg">{c.title}</h3>
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{c.copy}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <p className="cx-eyebrow">How we work</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PROCESS.map((p) => (
            <div key={p.step} className="cx-card border-t-2 border-t-[hsl(var(--accent))]">
              <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>
                {p.step}
              </p>
              <h3 className="cx-display mt-2 text-lg">{p.title}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{p.copy}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/contact" className="cx-btn cx-btn-primary cx-btn-lg">
          Discuss your website
        </Link>
        <Link href="/get-started" className="cx-btn cx-btn-secondary cx-btn-lg">
          Get started
        </Link>
      </div>
    </SolutionPageShell>
  );
}

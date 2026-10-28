import { Link } from "wouter";
import { SolutionPageShell } from "./SolutionPageShell";

const CHANNELS = [
  { name: "Email", stat: "Sequences + segmentation" },
  { name: "Social", stat: "Scheduling + content calendar" },
  { name: "Search", stat: "Keyword + landing page tracking" },
  { name: "Content", stat: "Idea pipeline + publishing" },
];

export function MarketingTech() {
  return (
    <SolutionPageShell
      eyebrow="Solutions · Marketing technology"
      title="Marketing Technology & Automation That Attracts Customers"
      intro="A shared calendar and content pipeline for the whole marketing stack, so channels stop working in isolation."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CHANNELS.map((c) => (
          <div key={c.name} className="cx-card">
            <p className="cx-badge cx-badge-accent">{c.name}</p>
            <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">{c.stat}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
        Campaigns work best when visitors land on a fast, clear website. Explore our{" "}
        <Link href="/solutions/website-development" className="text-[hsl(var(--accent))] underline">
          web design &amp; development services
        </Link>{" "}
        and landing pages built for enquiries.
      </p>
    </SolutionPageShell>
  );
}

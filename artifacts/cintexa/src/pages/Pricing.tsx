import { Link } from "wouter";

const PLANS = [
  { name: "Starter", price: "$0", tagline: "For testing the platform", features: ["1 workspace", "Core marketing tools", "Community support"] },
  { name: "Growth", price: "$149/mo", tagline: "For scaling teams", features: ["Unlimited workspaces", "Ads Boost + e-commerce", "Loyalty ledger", "Priority support"], highlighted: true },
  { name: "Enterprise", price: "Talk to us", tagline: "For platform-scale needs", features: ["Custom modules", "Dedicated infrastructure", "SLA + onboarding"] },
];

export function Pricing() {
  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">Pricing</p>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">Pick a plan, grow into the platform.</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className="cx-card flex flex-col"
              style={p.highlighted ? { borderColor: "hsl(var(--accent) / .5)", boxShadow: "var(--shadow-accent)" } : undefined}
            >
              {p.highlighted && <span className="cx-badge cx-badge-accent mb-3 w-fit">Most popular</span>}
              <h3 className="cx-display text-xl">{p.name}</h3>
              <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{p.tagline}</p>
              <p className="cx-display mt-5 text-2xl">{p.price}</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="text-sm text-[hsl(var(--fg-muted))]">· {f}</li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className={`cx-btn mt-6 w-full ${p.highlighted ? "cx-btn-primary" : "cx-btn-secondary"}`}
              >
                {p.name === "Enterprise" ? "Contact sales" : "Get started"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { GsapStagger } from "@/components/motion/GsapStagger";

const MODULES = [
  { name: "Subscriptions & entitlements", status: "Available" },
  { name: "Loyalty ledger", status: "Available" },
  { name: "E-commerce module", status: "Available" },
  { name: "Ads module", status: "Available" },
  { name: "CRM module", status: "Foundation" },
  { name: "Insight Workforce", status: "Available" },
  { name: "BI module", status: "Foundation" },
  { name: "Customer portals", status: "Available" },
];

export function Platform() {
  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">Platform</p>
        <h1 className="cx-display mt-3 max-w-2xl text-3xl sm:text-4xl">
          Built to extend, not to be rebuilt.
        </h1>
        <p className="mt-4 max-w-2xl text-[hsl(var(--fg-muted))]">
          CINTEXA is a connected technology platform for sales, marketing, commerce, advertising, and growth — with an
          Insight Workforce that turns verified account activity into evidence-based recommendations.
        </p>
        <GsapStagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.name} className="cx-card">
              <p className="font-medium">{m.name}</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-[hsl(var(--fg-muted))]">{m.status}</p>
            </div>
          ))}
        </GsapStagger>
      </div>
    </div>
  );
}

import { GsapStagger } from "@/components/motion/GsapStagger";

const MODULES = [
  { name: "Subscriptions & entitlements", status: "Available" },
  { name: "Loyalty ledger", status: "Available" },
  { name: "E-commerce module", status: "Available" },
  { name: "Ads module", status: "Available" },
  { name: "CRM module", status: "Foundation" },
  { name: "AI module", status: "Available" },
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
        <p className="mt-4 max-w-xl text-[hsl(var(--fg-muted))]">
          Every module shares the same customer identity, billing, and activity ledger, so new
          capability doesn't mean a new system.
        </p>
        <GsapStagger className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.name} className="cx-card cx-card-inset flex flex-col justify-between gap-4">
              <p className="text-sm font-medium">{m.name}</p>
              <span className={`cx-badge ${m.status === "Available" ? "cx-badge-accent" : ""}`}>{m.status}</span>
            </div>
          ))}
        </GsapStagger>
      </div>
    </div>
  );
}

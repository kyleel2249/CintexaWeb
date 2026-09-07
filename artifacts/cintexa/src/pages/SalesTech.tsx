import { SolutionPageShell } from "./SolutionPageShell";

const STAGES = ["Visitor", "Lead", "Opportunity", "Customer", "Loyal"];

export function SalesTech() {
  return (
    <SolutionPageShell
      eyebrow="Solutions · Sales technology"
      title="A pipeline built for the whole customer lifetime, not just the first sale."
      intro="Track every account from first visit to repeat purchase, with the loyalty and contribution data your CRM was missing."
    >
      <div className="cx-card">
        <p className="cx-eyebrow">Visitor → Loyal path · illustrative flow</p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="cx-badge">{s}</span>
              {i < STAGES.length - 1 && <span style={{ color: "hsl(var(--fg-muted))" }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </SolutionPageShell>
  );
}

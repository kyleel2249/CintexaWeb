import { DashboardShell } from "./DashboardShell";

const SAMPLE_CONTRIBUTIONS = [
  { reference: "CTR-1042", description: "Growth plan — monthly", amount: "149.00", currency: "GHS", status: "paid" },
  { reference: "CTR-1041", description: "Ads Boost top-up", amount: "60.00", currency: "GHS", status: "paid" },
  { reference: "CTR-1040", description: "Growth plan — monthly", amount: "149.00", currency: "GHS", status: "pending" },
];

export function DashboardContributions() {
  return (
    <DashboardShell>
      <div className="cx-card overflow-hidden !p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--fg-muted))]">
              <th className="px-5 py-3 font-medium">Reference</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_CONTRIBUTIONS.map((c) => (
              <tr key={c.reference} className="border-b border-[hsl(var(--border))] last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-[hsl(var(--fg-muted))]">{c.reference}</td>
                <td className="px-5 py-3">{c.description}</td>
                <td className="px-5 py-3">{c.currency} {c.amount}</td>
                <td className="px-5 py-3">
                  <span className={`cx-badge ${c.status === "paid" ? "cx-badge-accent" : ""}`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-[hsl(var(--fg-muted))]">
        Sample contribution history — connect the API server to load real records from
        `contributions` in lib/db.
      </p>
    </DashboardShell>
  );
}

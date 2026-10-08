import { DashboardShell } from "./DashboardShell";
import { useMyContributions } from "@/hooks/useApi";
import { InsightPanel } from "@/components/insights/InsightPanel";

export function DashboardContributions() {
  const { data, isLoading, isError } = useMyContributions();
  const contributions = data?.contributions ?? [];

  const paid = contributions.filter((c) => c.status === "paid" || c.status === "completed");
  const totalPaid = paid.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const currency = paid[0]?.currency || contributions[0]?.currency || "";

  return (
    <DashboardShell>
      <div className="mb-6">
        <p className="cx-eyebrow">Account activity</p>
        <h2 className="cx-display mt-1 text-2xl">Contributions</h2>
        <p className="mt-2 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
          Track payments, commissions, and contribution history for your CINTEXA account.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="cx-card">
          <p className="text-xs text-[hsl(var(--fg-muted))]">Total records</p>
          <p className="cx-display mt-1 text-2xl">{isLoading ? "—" : contributions.length}</p>
        </div>
        <div className="cx-card">
          <p className="text-xs text-[hsl(var(--fg-muted))]">Completed</p>
          <p className="cx-display mt-1 text-2xl">{isLoading ? "—" : paid.length}</p>
        </div>
        <div className="cx-card">
          <p className="text-xs text-[hsl(var(--fg-muted))]">Verified total</p>
          <p className="cx-display mt-1 text-2xl">
            {isLoading ? "—" : paid.length ? `${currency} ${totalPaid.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {isError && (
        <div className="cx-card mb-4" style={{ borderColor: "hsl(var(--danger) / .5)" }}>
          <p className="text-sm" style={{ color: "hsl(var(--danger))" }}>
            Couldn&apos;t load contributions right now. Try refreshing.
          </p>
        </div>
      )}

      {!isLoading && !isError && contributions.length === 0 && (
        <div className="cx-card text-center">
          <p className="text-sm text-[hsl(var(--fg-muted))]">
            No contributions yet. Completed payments and commissions will appear here.
          </p>
        </div>
      )}

      {(isLoading || contributions.length > 0) && (
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
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-[hsl(var(--border))] last:border-0">
                      <td className="px-5 py-3" colSpan={4}>
                        <span className="inline-block h-4 w-full animate-pulse rounded bg-[hsl(var(--bg-inset))]" />
                      </td>
                    </tr>
                  ))
                : contributions.map((c) => (
                    <tr key={c.id} className="border-b border-[hsl(var(--border))] last:border-0">
                      <td className="px-5 py-3 font-mono text-xs text-[hsl(var(--fg-muted))]">
                        {c.reference}
                      </td>
                      <td className="px-5 py-3">{c.description}</td>
                      <td className="px-5 py-3">
                        {c.currency} {c.amount}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`cx-badge ${
                            c.status === "paid" || c.status === "completed"
                              ? "cx-badge-success"
                              : "cx-badge-muted"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <InsightPanel specialistId="contributions" title="Contributions Insight" />
      </div>
    </DashboardShell>
  );
}

import { DashboardShell } from "./DashboardShell";
import { useMyContributions } from "@/hooks/useApi";

export function DashboardContributions() {
  const { data, isLoading, isError } = useMyContributions();
  const contributions = data?.contributions ?? [];

  return (
    <DashboardShell>
      {isError && (
        <div className="cx-card mb-4" style={{ borderColor: "hsl(var(--danger) / .5)" }}>
          <p className="text-sm" style={{ color: "hsl(var(--danger))" }}>
            Couldn't load contributions right now. Try refreshing.
          </p>
        </div>
      )}

      {!isLoading && !isError && contributions.length === 0 && (
        <div className="cx-card text-center">
          <p className="text-sm text-[hsl(var(--fg-muted))]">No contributions yet.</p>
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
      )}
    </DashboardShell>
  );
}

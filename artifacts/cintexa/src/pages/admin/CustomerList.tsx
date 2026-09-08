import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminApi";

interface AdminCustomer {
  userId: string;
  displayName: string | null;
  businessName: string | null;
  plan: string | null;
  status: string | null;
  balance: number;
  updatedAt: string;
}

export function CustomerList({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => adminFetch<{ customers: AdminCustomer[] }>("/admin/customers", adminKey),
  });

  return (
    <div className="cx-card !p-0 overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] px-5 py-3">
        <p className="cx-eyebrow">Customers</p>
      </div>
      {isLoading && <p className="px-5 py-4 text-sm text-[hsl(var(--fg-muted))]">Loading…</p>}
      {isError && <p className="px-5 py-4 text-sm" style={{ color: "hsl(var(--danger))" }}>Couldn't load customers.</p>}
      {data && data.customers.length === 0 && (
        <p className="px-5 py-4 text-sm text-[hsl(var(--fg-muted))]">No customers yet.</p>
      )}
      {data && data.customers.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--fg-muted))]">
              <th className="px-5 py-2 font-medium">User</th>
              <th className="px-5 py-2 font-medium">Plan</th>
              <th className="px-5 py-2 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.customers.map((c) => (
              <tr key={c.userId} className="border-b border-[hsl(var(--border))] last:border-0">
                <td className="px-5 py-2">
                  <p className="font-medium">{c.displayName ?? c.userId}</p>
                  <p className="font-mono text-xs text-[hsl(var(--fg-muted))]">{c.userId}</p>
                </td>
                <td className="px-5 py-2">{c.plan ?? "—"}</td>
                <td className="px-5 py-2">{c.balance} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

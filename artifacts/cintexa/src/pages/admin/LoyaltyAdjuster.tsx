import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminApi";

export function LoyaltyAdjuster({ adminKey }: { adminKey: string }) {
  const [userId, setUserId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      adminFetch("/admin/loyalty/adjust", adminKey, {
        method: "POST",
        body: { userId, delta: Number(delta), reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setDelta("");
      setReason("");
    },
  });

  return (
    <form
      className="cx-card flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <p className="cx-eyebrow">Adjust loyalty points</p>
      <div className="cx-field">
        <label className="cx-label" htmlFor="adj-userId">User ID</label>
        <input id="adj-userId" className="cx-input" value={userId} onChange={(e) => setUserId(e.target.value)} required />
      </div>
      <div className="cx-field">
        <label className="cx-label" htmlFor="adj-delta">Delta (+/-)</label>
        <input id="adj-delta" type="number" className="cx-input" value={delta} onChange={(e) => setDelta(e.target.value)} required />
      </div>
      <div className="cx-field">
        <label className="cx-label" htmlFor="adj-reason">Reason</label>
        <input id="adj-reason" className="cx-input" value={reason} onChange={(e) => setReason(e.target.value)} required />
      </div>
      <button type="submit" className="cx-btn cx-btn-primary w-fit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Apply"}
      </button>
      {mutation.isSuccess && <p className="text-sm" style={{ color: "hsl(var(--success))" }}>Applied.</p>}
      {mutation.isError && <p className="text-sm" style={{ color: "hsl(var(--danger))" }}>{(mutation.error as Error).message}</p>}
    </form>
  );
}

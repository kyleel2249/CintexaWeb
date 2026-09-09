import { useState } from "react";
import { DashboardShell } from "./DashboardShell";
import { useMyProfile } from "@/hooks/useApi";
import { getSortedFaq } from "@/lib/faq";

export function DashboardFaq() {
  const profile = useMyProfile();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const role = profile.data?.profile?.role;
  const interests = profile.data?.profile?.interests ?? [];
  const entries = getSortedFaq(role, interests);

  return (
    <DashboardShell>
      <p className="mb-4 text-sm text-[hsl(var(--fg-muted))]">
        {role ? "Sorted for what you told us you're interested in." : "General answers to get you started."}
      </p>
      <div className="cx-card !p-0 overflow-hidden">
        {entries.map((entry, i) => (
          <div key={entry.question} className="border-b border-[hsl(var(--border))] last:border-0">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
            >
              <span className="text-sm font-medium">{entry.question}</span>
              <span
                className="text-[hsl(var(--fg-muted))]"
                style={{ transform: openIndex === i ? "rotate(180deg)" : undefined, transition: "transform 160ms ease" }}
              >
                ▾
              </span>
            </button>
            {openIndex === i && (
              <p className="px-5 pb-4 text-sm text-[hsl(var(--fg-muted))]">{entry.answer}</p>
            )}
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

import type { ReactNode } from "react";

export function SolutionPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">{eyebrow}</p>
        <h1 className="cx-display mt-3 max-w-2xl text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-[hsl(var(--fg-muted))]">{intro}</p>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}

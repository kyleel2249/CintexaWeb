import type { ReactNode } from "react";
import { PrimaryNav } from "@/components/nav/PrimaryNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollProgress } from "@/components/scroll-progress";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
      <ScrollProgress />
      <PrimaryNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

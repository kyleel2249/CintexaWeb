import type { ReactNode } from "react";
import { PrimaryNav } from "@/components/nav/PrimaryNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollProgress } from "@/components/scroll-progress";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[hsl(var(--accent))] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[hsl(var(--accent-ink))]"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <PrimaryNav />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}

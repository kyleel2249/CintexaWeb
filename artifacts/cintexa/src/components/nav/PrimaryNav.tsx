import { useState } from "react";
import { Link, useRoute } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/brand";
import { useMotion } from "@/components/motion/MotionProvider";

interface NavGroup {
  label: string;
  items: { label: string; href: string; blurb: string }[];
}

const SOLUTIONS: NavGroup = {
  label: "Solutions",
  items: [
    { label: "Marketing technology", href: "/solutions/marketing", blurb: "Campaign channels and content velocity" },
    { label: "Sales technology", href: "/solutions/sales", blurb: "Visitor-to-loyal customer pipeline" },
    { label: "Ads Boost", href: "/solutions/ads-boost", blurb: "Programmatic campaign lifecycle" },
    { label: "E-commerce", href: "/solutions/ecommerce", blurb: "Storefront, catalog, and checkout" },
  ],
};

const NAV_LINKS = [
  { label: "Platform", href: "/platform" },
  { label: "Pricing", href: "/pricing" },
];

export function PrimaryNav() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { allowMotion } = useMotion();
  const [onDashboard] = useRoute("/dashboard/:rest*");
  const [onGetStarted] = useRoute("/get-started");

  return (
    <header className="cx-nav">
      <div className="cx-container flex w-full items-center justify-between">
        <Link href="/" aria-label="CINTEXA home">
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              className="cx-nav-link flex items-center gap-1"
              aria-expanded={solutionsOpen}
              aria-haspopup="true"
              onClick={() => setSolutionsOpen((v) => !v)}
            >
              {SOLUTIONS.label}
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden style={{ transform: solutionsOpen ? "rotate(180deg)" : undefined, transition: "transform 160ms ease" }}>
                <path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            <AnimatePresence>
              {solutionsOpen && (
                <motion.div
                  initial={allowMotion ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={allowMotion ? { opacity: 0, y: 8 } : undefined}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="cx-dropdown-panel absolute left-0 top-[calc(100%+10px)] w-72 p-2"
                  role="menu"
                >
                  {SOLUTIONS.items.map((item) => (
                    <Link key={item.href} href={item.href} role="menuitem">
                      <div className="rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[hsl(var(--fg)/0.06)]">
                        <p className="text-sm font-medium text-[hsl(var(--fg))]">{item.label}</p>
                        <p className="mt-0.5 text-xs text-[hsl(var(--fg-muted))]">{item.blurb}</p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="cx-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard" className={`cx-btn cx-btn-secondary cx-btn-sm ${onDashboard ? "border-[hsl(var(--accent)/.6)]" : ""}`}>
            Dashboard
          </Link>
          <Link href="/get-started" className={`cx-btn cx-btn-primary cx-btn-sm ${onGetStarted ? "ring-2 ring-[hsl(var(--accent)/.4)]" : ""}`}>
            Get started
          </Link>
        </div>

        <button
          className="cx-btn cx-btn-ghost cx-btn-sm md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={allowMotion ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: "auto" }}
            exit={allowMotion ? { opacity: 0, height: 0 } : undefined}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-full overflow-hidden border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] md:hidden"
          >
            <div className="cx-container flex flex-col gap-1 py-4">
              {SOLUTIONS.items.map((item) => (
                <Link key={item.href} href={item.href} className="cx-nav-link" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="cx-nav-link" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <Link href="/dashboard" className="cx-btn cx-btn-secondary mt-2 w-full" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              <Link href="/get-started" className="cx-btn cx-btn-primary w-full" onClick={() => setMobileOpen(false)}>
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

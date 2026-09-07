import { Link } from "wouter";
import { BrandMark } from "@/components/brand";

const COLUMNS = [
  {
    title: "Solutions",
    links: [
      { label: "Marketing technology", href: "/solutions/marketing" },
      { label: "Sales technology", href: "/solutions/sales" },
      { label: "Ads Boost", href: "/solutions/ads-boost" },
      { label: "E-commerce", href: "/solutions/ecommerce" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "/platform" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-10">
      <div className="cx-container flex flex-col gap-8 md:flex-row md:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="cx-eyebrow">TECHNOLOGY · COMMERCE · MOTION · INTELLIGENCE</span>
          </div>
          <p className="text-sm text-[hsl(var(--fg-muted))]">
            A growth platform for teams building their next stage of scale.
          </p>
        </div>
        <div className="flex gap-12">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-2">
              <p className="cx-eyebrow">{col.title}</p>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg))]">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="cx-container mt-8 border-t border-[hsl(var(--border))] pt-6 text-xs text-[hsl(var(--fg-muted))]">
        © {new Date().getFullYear()} CINTEXA. All rights reserved.
      </div>
    </footer>
  );
}

import { useEffect } from "react";
import { Link } from "wouter";
import { notFoundSeo } from "@/data/seo-pages";
import { applyPageSeo } from "@/lib/seo-dom";

const NEXT_STEPS = [
  { href: "/platform", label: "Browse our solutions" },
  { href: "/blog", label: "Read the blog" },
  { href: "/contact", label: "Contact CINTEXA" },
];

export function NotFound() {
  // Tell search engines this URL is not a page (noindex) instead of inheriting another page's head.
  useEffect(() => applyPageSeo(notFoundSeo()), []);
  return (
    <div className="cx-section">
      <div className="cx-container flex flex-col items-center text-center">
        <p className="cx-eyebrow">404</p>
        <h1 className="cx-display mt-3 text-3xl">This page doesn&apos;t exist.</h1>
        <p className="mt-3 text-[hsl(var(--fg-muted))]">Check the address, or head back to the homepage.</p>
        <Link href="/" className="cx-btn cx-btn-primary mt-6">
          Back to home
        </Link>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {NEXT_STEPS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-[hsl(var(--accent))] underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

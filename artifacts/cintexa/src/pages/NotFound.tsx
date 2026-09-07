import { Link } from "wouter";

export function NotFound() {
  return (
    <div className="cx-section">
      <div className="cx-container flex flex-col items-center text-center">
        <p className="cx-eyebrow">404</p>
        <h1 className="cx-display mt-3 text-3xl">This page doesn't exist.</h1>
        <p className="mt-3 text-[hsl(var(--fg-muted))]">Check the address, or head back to the homepage.</p>
        <Link href="/" className="cx-btn cx-btn-primary mt-6">
          Back to home
        </Link>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { SignIn, SignUp } from "@clerk/clerk-react";

const hasClerk =
  typeof import.meta.env.VITE_CLERK_PUBLISHABLE_KEY === "string" &&
  Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.trim());

const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  elements: {
    rootBox: "w-full",
    card: "bg-[hsl(var(--bg-raised))] border border-[hsl(var(--border))] shadow-none",
    footer: { display: "none" },
    footerAction: { display: "none" },
    badge: { display: "none" },
  },
} as const;

/**
 * Get Started — sign-in / sign-up entry (not pricing).
 * Clerk branding / development notices are suppressed via appearance props.
 */
export function GetStarted() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");

  return (
    <section className="cx-section">
      <div className="cx-container mx-auto max-w-lg">
        <p className="cx-eyebrow text-center">Get started</p>
        <h1 className="cx-display mt-3 text-center text-3xl sm:text-4xl">
          {mode === "sign-up" ? "Create your account" : "Sign in to CINTEXA"}
        </h1>
        <p className="mt-3 text-center text-sm text-[hsl(var(--fg-muted))]">
          Access your dashboard, contributions, progress, and platform tools.
        </p>

        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            className={`cx-btn cx-btn-sm ${mode === "sign-up" ? "cx-btn-primary" : "cx-btn-secondary"}`}
            onClick={() => setMode("sign-up")}
          >
            Sign up
          </button>
          <button
            type="button"
            className={`cx-btn cx-btn-sm ${mode === "sign-in" ? "cx-btn-primary" : "cx-btn-secondary"}`}
            onClick={() => setMode("sign-in")}
          >
            Sign in
          </button>
        </div>

        <div className="mt-8 flex justify-center [&.cl-internal-b3fm6y]:hidden">
          {hasClerk ? (
            mode === "sign-up" ? (
              <SignUp
                routing="hash"
                signInUrl="/get-started#sign-in"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            ) : (
              <SignIn
                routing="hash"
                signUpUrl="/get-started#sign-up"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            )
          ) : (
            <div className="cx-card w-full max-w-md p-6 text-center">
              <p className="text-sm text-[hsl(var(--fg-muted))]">
                Authentication is not configured for this deployment yet. Set{" "}
                <code className="text-[hsl(var(--accent))]">VITE_CLERK_PUBLISHABLE_KEY</code> in
                Cloudflare Pages and redeploy to enable sign-in and sign-up.
              </p>
              <Link href="/pricing" className="cx-btn cx-btn-secondary mt-6 inline-flex">
                View pricing
              </Link>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[hsl(var(--fg-muted))]">
          Looking for plans?{" "}
          <Link href="/pricing" className="underline underline-offset-2 hover:text-[hsl(var(--fg))]">
            See pricing
          </Link>
        </p>
      </div>
    </section>
  );
}

export default GetStarted;

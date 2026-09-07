import { Link } from "wouter";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import type { SubscriptionPlan } from "@cintexa/db";
import { useMySubscription, useSetSubscription } from "@/hooks/useApi";

const PLANS: { id: SubscriptionPlan; name: string; price: string; tagline: string; features: string[]; highlighted?: boolean }[] = [
  { id: "starter", name: "Starter", price: "$0", tagline: "For testing the platform", features: ["1 workspace", "Core marketing tools", "Community support"] },
  { id: "growth", name: "Growth", price: "$149/mo", tagline: "For scaling teams", features: ["Unlimited workspaces", "Ads Boost + e-commerce", "Loyalty ledger", "Priority support"], highlighted: true },
  { id: "enterprise", name: "Enterprise", price: "Talk to us", tagline: "For platform-scale needs", features: ["Custom modules", "Dedicated infrastructure", "SLA + onboarding"] },
];

function PlanButton({ plan }: { plan: (typeof PLANS)[number] }) {
  const subscription = useMySubscription();
  const setSubscription = useSetSubscription();
  const isCurrent = subscription.data?.subscription?.plan === plan.id;

  if (plan.id === "enterprise") {
    return (
      <Link href="/platform" className="cx-btn cx-btn-secondary mt-6 w-full">
        Contact sales
      </Link>
    );
  }

  return (
    <button
      className={`cx-btn mt-6 w-full ${plan.highlighted ? "cx-btn-primary" : "cx-btn-secondary"}`}
      disabled={isCurrent || setSubscription.isPending}
      onClick={() => setSubscription.mutate(plan.id)}
    >
      {isCurrent ? "Current plan" : setSubscription.isPending ? "Updating…" : "Choose this plan"}
    </button>
  );
}

export function Pricing() {
  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">Pricing</p>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">Pick a plan, grow into the platform.</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className="cx-card flex flex-col"
              style={p.highlighted ? { borderColor: "hsl(var(--accent) / .5)", boxShadow: "var(--shadow-accent)" } : undefined}
            >
              {p.highlighted && <span className="cx-badge cx-badge-accent mb-3 w-fit">Most popular</span>}
              <h3 className="cx-display text-xl">{p.name}</h3>
              <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{p.tagline}</p>
              <p className="cx-display mt-5 text-2xl">{p.price}</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="text-sm text-[hsl(var(--fg-muted))]">· {f}</li>
                ))}
              </ul>
              <SignedIn>
                <PlanButton plan={p} />
              </SignedIn>
              <SignedOut>
                {p.id === "enterprise" ? (
                  <Link href="/platform" className="cx-btn cx-btn-secondary mt-6 w-full">
                    Contact sales
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <button className={`cx-btn mt-6 w-full ${p.highlighted ? "cx-btn-primary" : "cx-btn-secondary"}`}>
                      Sign in to choose
                    </button>
                  </SignInButton>
                )}
              </SignedOut>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

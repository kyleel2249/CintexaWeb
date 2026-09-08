import { useState } from "react";
import { Link } from "wouter";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import type { SubscriptionPlan } from "@cintexa/db/schema";
import { useMySubscription, useSetSubscription } from "@/hooks/useApi";
import {
  PLATFORM_FEE_RATE_DEFAULT,
  PROMO_CODE,
  applyPromoCode,
  hasActivePromo,
  readPromoCode,
} from "@/lib/platform-economics";

const PLANS: {
  id: SubscriptionPlan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    tagline: "Always free to start",
    features: [
      "1 workspace",
      "Core marketing & posting tools",
      `Platform fee ${(PLATFORM_FEE_RATE_DEFAULT * 100).toFixed(0)}% on sales (waived with promo ${PROMO_CODE})`,
      "Community support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$149/mo",
    tagline: "For scaling teams",
    features: [
      "Unlimited workspaces",
      "Ads Boost + e-commerce + social scheduling",
      "Loyalty ledger",
      `Platform fee ${(PLATFORM_FEE_RATE_DEFAULT * 100).toFixed(0)}% · free with ${PROMO_CODE}`,
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Talk to us",
    tagline: "For platform-scale needs",
    features: ["Custom modules", "Dedicated infrastructure", "SLA + onboarding", "Custom fee agreements"],
  },
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
      type="button"
      className={`cx-btn mt-6 w-full ${plan.highlighted ? "cx-btn-primary" : "cx-btn-secondary"}`}
      disabled={isCurrent || setSubscription.isPending}
      onClick={() => setSubscription.mutate(plan.id)}
    >
      {isCurrent ? "Current plan" : setSubscription.isPending ? "Updating…" : plan.id === "starter" ? "Start free" : "Choose this plan"}
    </button>
  );
}

export function Pricing() {
  const [code, setCode] = useState(readPromoCode() ?? "");
  const [msg, setMsg] = useState("");
  const promoOn = hasActivePromo();

  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">Pricing</p>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">Starter is free. Platform fee is clear.</h1>
        <p className="mt-4 max-w-2xl text-sm text-[hsl(var(--fg-muted))]">
          Sales and payouts carry a <strong>{(PLATFORM_FEE_RATE_DEFAULT * 100).toFixed(0)}% platform fee</strong> by
          default. Enter promo code <strong>{PROMO_CODE}</strong> to waive the platform fee (0%). Starter plan is always
          free.
        </p>

        <div className="cx-card mt-8 flex max-w-md flex-col gap-3">
          <label className="cx-label" htmlFor="promo">
            Promo code
          </label>
          <div className="flex gap-2">
            <input
              id="promo"
              className="cx-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={PROMO_CODE}
            />
            <button
              type="button"
              className="cx-btn cx-btn-primary shrink-0"
              onClick={() => {
                const r = applyPromoCode(code);
                setMsg(r.message);
              }}
            >
              Apply
            </button>
          </div>
          {msg && <p className="text-sm text-[hsl(var(--fg-muted))]">{msg}</p>}
          {promoOn && (
            <p className="text-sm font-medium" style={{ color: "hsl(var(--success))" }}>
              Active: {PROMO_CODE} — platform fee waived.
            </p>
          )}
        </div>

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
                  <li key={f} className="text-sm text-[hsl(var(--fg-muted))]">
                    · {f}
                  </li>
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
                    <button type="button" className={`cx-btn mt-6 w-full ${p.highlighted ? "cx-btn-primary" : "cx-btn-secondary"}`}>
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

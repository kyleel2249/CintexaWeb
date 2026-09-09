import { useState } from "react";
import { Link } from "wouter";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import type { SubscriptionPlan } from "@cintexa/db/schema";
import { useMySubscription, useSetSubscription } from "@/hooks/useApi";
import {
  PLATFORM_FEE_RATE_DEFAULT,
  PLATFORM_FEE_RATE_PROMO,
  PROMO_CODE,
  applyPromoCode,
  hasActivePromo,
  readPromoCode,
} from "@/lib/platform-economics";

const DEFAULT_PCT = (PLATFORM_FEE_RATE_DEFAULT * 100).toFixed(0);
const PROMO_PCT = (PLATFORM_FEE_RATE_PROMO * 100).toFixed(0);

/**
 * Plans are framed only in percentages (no currency amounts).
 * Quiet anchoring: higher industry-style % nearby so the platform rate feels natural.
 */
const PLANS: {
  id: SubscriptionPlan;
  name: string;
  /** Primary figure — percentage only */
  rateLabel: string;
  reference?: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    id: "starter",
    name: "Starter",
    rateLabel: "0%",
    reference: "Subscription charge on this plan",
    tagline: "Full access to get moving",
    features: [
      "1 workspace",
      "Core marketing & posting tools",
      `Platform fee on sales: ${DEFAULT_PCT}% · ${PROMO_PCT}% with ${PROMO_CODE}`,
      "Community support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    rateLabel: `${DEFAULT_PCT}%`,
    reference: `Standard platform share · ${PROMO_PCT}% with ${PROMO_CODE}. Many commerce stacks land closer to 10–15%.`,
    tagline: "One connected growth system",
    features: [
      "Unlimited workspaces",
      "Ads Boost, e-commerce & social scheduling",
      "Loyalty ledger",
      `Platform fee on sales: ${DEFAULT_PCT}% · ${PROMO_PCT}% with ${PROMO_CODE}`,
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    rateLabel: "Custom %",
    reference: "Volume terms negotiated from the standard platform rate",
    tagline: "Architecture, SLA, and dedicated ops",
    features: [
      "Custom modules",
      "Dedicated infrastructure",
      "SLA + onboarding",
      "Fee percentage tailored to volume",
    ],
  },
];

function PlanButton({ plan }: { plan: (typeof PLANS)[number] }) {
  const subscription = useMySubscription();
  const setSubscription = useSetSubscription();
  const isCurrent = subscription.data?.subscription?.plan === plan.id;

  if (plan.id === "enterprise") {
    return (
      <Link href="/platform" className="cx-btn cx-btn-secondary mt-6 w-full">
        Talk with us
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
      {isCurrent
        ? "Current plan"
        : setSubscription.isPending
          ? "Updating…"
          : plan.id === "starter"
            ? "Start free"
            : "Continue with Growth"}
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
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">Clear percentages on every sale.</h1>
        <p className="mt-4 max-w-2xl text-sm text-[hsl(var(--fg-muted))]">
          Platform fee is <strong>{DEFAULT_PCT}%</strong> on sales by default. Apply <strong>{PROMO_CODE}</strong> for{" "}
          <strong>{PROMO_PCT}%</strong>. Starter has a <strong>0%</strong> subscription charge.
        </p>

        <div className="cx-card mt-8 flex max-w-md flex-col gap-3">
          <label className="cx-label" htmlFor="promo">
            Have a code?
          </label>
          <div className="flex gap-2">
            <input
              id="promo"
              className="cx-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={PROMO_CODE}
              autoComplete="off"
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
              {PROMO_CODE} active — platform fee {PROMO_PCT}% on sales.
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
              {p.highlighted && (
                <span className="cx-badge cx-badge-accent mb-3 w-fit">Chosen by most teams</span>
              )}
              <h3 className="cx-display text-xl">{p.name}</h3>
              <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{p.tagline}</p>
              <div className="mt-5">
                <p className="cx-display text-3xl">{p.rateLabel}</p>
                {p.reference && (
                  <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--fg-muted))]">{p.reference}</p>
                )}
              </div>
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
                    Talk with us
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className={`cx-btn mt-6 w-full ${p.highlighted ? "cx-btn-primary" : "cx-btn-secondary"}`}
                    >
                      Sign in to continue
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

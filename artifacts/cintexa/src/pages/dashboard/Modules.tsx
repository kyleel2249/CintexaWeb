import { useMemo, useState } from "react";
import { DashboardShell } from "./DashboardShell";
import { useMyProfile } from "@/hooks/useApi";
import { currentPlatformFeeRate } from "@/lib/platform-economics";
import { faqForInterests } from "@/lib/interest-faq";

const TEMPLATES = [
  { name: "Launch email sequence", tag: "Email" },
  { name: "Product landing outline", tag: "Web" },
  { name: "Affiliate promo kit", tag: "Affiliate" },
  { name: "Social pixel checklist", tag: "Ads" },
];

export function DashboardTemplates() {
  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Templates</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Ready-to-adapt kits for campaigns, pages, and partner outreach.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <article key={t.name} className="cx-card">
            <span className="cx-badge">{t.tag}</span>
            <h3 className="mt-3 font-semibold">{t.name}</h3>
            <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm mt-4">
              Use template
            </button>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}

export function DashboardAffiliate() {
  const code = "CX-" + (typeof window !== "undefined" ? (localStorage.getItem("cintexa.aff") ?? "DEMO01") : "DEMO01");
  const feePct = (currentPlatformFeeRate() * 100).toFixed(0);
  const keepPct = (100 - currentPlatformFeeRate() * 100).toFixed(0);
  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Affiliate marketing</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Share your link and track referrals. Platform fee {feePct}% · you keep {keepPct}% of attributed sales.
      </p>
      <div className="cx-card mt-6 max-w-lg">
        <p className="text-xs uppercase tracking-wider text-[hsl(var(--fg-muted))]">Your referral code</p>
        <p className="mt-2 font-mono text-lg">{code}</p>
        <p className="mt-4 text-sm text-[hsl(var(--fg-muted))]">Sample share of attributed volume shown as percentages in Payback.</p>
      </div>
    </DashboardShell>
  );
}

export function DashboardAnalytics() {
  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Analytics</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Demo rates — connect live sources when your API is deployed.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { l: "Conversion rate (7d)", v: "4.3%" },
          { l: "Engagement rate", v: "12%" },
          { l: "Repeat purchase share", v: "28%" },
        ].map((m) => (
          <div key={m.l} className="cx-card">
            <p className="text-xs text-[hsl(var(--fg-muted))]">{m.l}</p>
            <p className="mt-2 cx-display text-2xl">{m.v}</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

export function DashboardPixels() {
  const [fb, setFb] = useState(() => localStorage.getItem("cintexa.pixel.fb") ?? "");
  const [tt, setTt] = useState(() => localStorage.getItem("cintexa.pixel.tt") ?? "");
  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Facebook &amp; social pixels</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Store pixel IDs for Meta, TikTok, and similar networks. Tags only fire when marketing cookie consent is granted.
      </p>
      <form
        className="cx-card mt-6 flex max-w-md flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem("cintexa.pixel.fb", fb);
          localStorage.setItem("cintexa.pixel.tt", tt);
        }}
      >
        <label className="cx-field">
          <span className="cx-label">Meta / Facebook Pixel ID</span>
          <input className="cx-input" value={fb} onChange={(e) => setFb(e.target.value)} placeholder="1234567890" />
        </label>
        <label className="cx-field">
          <span className="cx-label">TikTok / other pixel ID</span>
          <input className="cx-input" value={tt} onChange={(e) => setTt(e.target.value)} placeholder="Optional" />
        </label>
        <button type="submit" className="cx-btn cx-btn-primary w-fit">
          Save pixel settings
        </button>
      </form>
    </DashboardShell>
  );
}

export function DashboardEmail() {
  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Email support</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Contact the CINTEXA team or queue a support thread.</p>
      <div className="cx-card mt-6 max-w-lg space-y-3">
        <p className="text-sm">
          Support:{" "}
          <a className="underline" href="mailto:support@cintexa.com">
            support@cintexa.com
          </a>
        </p>
        <p className="text-sm text-[hsl(var(--fg-muted))]">Typical response within 1 business day (demo policy).</p>
        <a className="cx-btn cx-btn-secondary w-fit" href="mailto:support@cintexa.com?subject=CINTEXA%20support">
          Open email
        </a>
      </div>
    </DashboardShell>
  );
}

export function DashboardPayback() {
  const [method, setMethod] = useState<"card" | "momo" | "bank">("momo");
  const feePct = (currentPlatformFeeRate() * 100).toFixed(0);
  const keepPct = (100 - currentPlatformFeeRate() * 100).toFixed(0);
  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Payback</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Payouts via card, Mobile Money, or bank transfer. All figures are shown as <strong>percentages</strong> of each
        sale.
      </p>
      <div className="cx-card mt-6 max-w-md space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["card", "Card"],
              ["momo", "Mobile Money"],
              ["bank", "Bank transfer"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`cx-btn cx-btn-sm ${method === id ? "cx-btn-primary" : "cx-btn-secondary"}`}
              onClick={() => setMethod(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Gross sale</dt>
            <dd>100%</dd>
          </div>
          <div className="flex justify-between text-[hsl(var(--fg-muted))]">
            <dt>Platform fee</dt>
            <dd>−{feePct}%</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>You receive</dt>
            <dd>{keepPct}%</dd>
          </div>
        </dl>
        <button type="button" className="cx-btn cx-btn-primary">
          Request payout ({method === "momo" ? "Mobile Money" : method === "bank" ? "Bank" : "Card"})
        </button>
        <p className="text-xs text-[hsl(var(--fg-muted))]">Demo only — no live money movement.</p>
      </div>
    </DashboardShell>
  );
}

export function DashboardFaq() {
  const profile = useMyProfile();
  const interests = (profile.data?.profile?.interests as string[] | undefined) ?? [];
  const items = useMemo(() => faqForInterests(interests), [interests]);
  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">FAQ for you</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Answers matched to your onboarding interests{interests.length ? `: ${interests.join(", ")}` : ""}.
      </p>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <details key={item.q} className="cx-card">
            <summary className="cursor-pointer font-medium">{item.q}</summary>
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{item.a}</p>
          </details>
        ))}
      </div>
    </DashboardShell>
  );
}

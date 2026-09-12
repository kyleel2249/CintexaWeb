import { InsightPanel } from "@/components/insights/InsightPanel";
import { useMemo, useState } from "react";
import { DashboardShell } from "./DashboardShell";
import { useMyProfile, useMyActivity, useMyContributions, useMyLoyalty, useMyTickets, useCreateTicket, useMyPaymentMethods, useAddPaymentMethod } from "@/hooks/useApi";
import { currentPlatformFeeRate } from "@/lib/platform-economics";
import { faqForInterests } from "@/lib/interest-faq";
import { ApiError } from "@/lib/api";

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
      <InsightPanel tab="templates" />
    </DashboardShell>
  );
}

export function DashboardAffiliate() {
  const profile = useMyProfile();
  const username = (profile.data?.profile as { username?: string } | null)?.username;
  const feePct = (currentPlatformFeeRate() * 100).toFixed(0);
  const keepPct = (100 - currentPlatformFeeRate() * 100).toFixed(0);
  const [copied, setCopied] = useState(false);

  const referralLink =
    username && typeof window !== "undefined" ? `${window.location.origin}/get-started?ref=${username}` : null;

  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Affiliate marketing</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Share your link and track referrals. Platform fee {feePct}% · you keep {keepPct}% of attributed sales.
      </p>
      <div className="cx-card mt-6 max-w-lg">
        <p className="text-xs uppercase tracking-wider text-[hsl(var(--fg-muted))]">Your referral link</p>
        {referralLink ? (
          <>
            <p className="mt-2 break-all font-mono text-sm">{referralLink}</p>
            <button
              type="button"
              className="cx-btn cx-btn-secondary cx-btn-sm mt-3"
              onClick={() => {
                navigator.clipboard?.writeText(referralLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <p className="mt-4 text-sm text-[hsl(var(--fg-muted))]">
              Anyone who signs up through this link is attributed to you as their referrer.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
            Set a username in Settings to get your referral link.
          </p>
        )}
      </div>
      <InsightPanel tab="affiliate" />
    </DashboardShell>
  );
}

export function DashboardAnalytics() {
  const activity = useMyActivity();
  const contributions = useMyContributions();
  const loyalty = useMyLoyalty();

  const metrics = [
    { l: "Activity events recorded", v: activity.data?.pagination.total ?? 0, loading: activity.isLoading },
    { l: "Contributions recorded", v: contributions.data?.pagination.total ?? 0, loading: contributions.isLoading },
    { l: "Loyalty points balance", v: loyalty.data?.balance ?? 0, loading: loyalty.isLoading },
  ];

  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Analytics</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Real figures from your account.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.l} className="cx-card">
            <p className="text-xs text-[hsl(var(--fg-muted))]">{m.l}</p>
            <p className="mt-2 cx-display text-2xl">
              {m.loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-[hsl(var(--bg-inset))]" /> : m.v}
            </p>
          </div>
        ))}
      </div>
      <InsightPanel tab="analytics" />
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
      <InsightPanel tab="pixels" />
    </DashboardShell>
  );
}

export function DashboardEmail() {
  const tickets = useMyTickets();
  const createTicket = useCreateTicket();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Email support</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Message the CINTEXA team directly — your ticket is saved to your account and tracked below.
      </p>

      <form
        className="cx-card mt-6 max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim() || !message.trim()) return;
          createTicket.mutate(
            { subject, message },
            {
              onSuccess: () => {
                setSubject("");
                setMessage("");
              },
            },
          );
        }}
      >
        <label className="cx-field">
          <span className="cx-label">Subject</span>
          <input className="cx-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} required />
        </label>
        <label className="cx-field">
          <span className="cx-label">Message</span>
          <textarea
            className="cx-input min-h-24"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
            required
          />
        </label>
        <button type="submit" className="cx-btn cx-btn-primary w-fit" disabled={createTicket.isPending}>
          {createTicket.isPending ? "Sending…" : "Submit ticket"}
        </button>
        {createTicket.isError && (
          <p className="text-sm" style={{ color: "hsl(var(--danger))" }}>
            {createTicket.error instanceof ApiError ? createTicket.error.message : "Couldn't send — try again."}
          </p>
        )}
        <p className="text-xs text-[hsl(var(--fg-muted))]">
          Prefer email? Reach us directly at{" "}
          <a className="underline" href="mailto:support@cintexa.com">
            support@cintexa.com
          </a>
          .
        </p>
      </form>

      <div className="mt-6 max-w-lg">
        <p className="text-xs uppercase tracking-wider text-[hsl(var(--fg-muted))]">Your tickets</p>
        {tickets.isLoading && <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Loading…</p>}
        {tickets.data && tickets.data.tickets.length === 0 && (
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">No tickets yet.</p>
        )}
        {tickets.data && tickets.data.tickets.length > 0 && (
          <ul className="mt-2 space-y-2">
            {tickets.data.tickets.map((t) => (
              <li key={t.id} className="cx-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t.subject}</p>
                  <span className="cx-badge">{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{new Date(t.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <InsightPanel tab="email" />
    </DashboardShell>
  );
}

export function DashboardPayback() {
  const feePct = (currentPlatformFeeRate() * 100).toFixed(0);
  const keepPct = (100 - currentPlatformFeeRate() * 100).toFixed(0);
  const methods = useMyPaymentMethods();
  const addMethod = useAddPaymentMethod();
  const [type, setType] = useState<"card" | "mobile_money" | "bank_transfer">("mobile_money");
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");

  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Payback</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Payouts via card, Mobile Money, or bank transfer. All figures are shown as <strong>percentages</strong> of each
        sale.
      </p>
      <div className="cx-card mt-6 max-w-md space-y-4">
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
      </div>

      <div className="mt-6 max-w-md">
        <p className="text-xs uppercase tracking-wider text-[hsl(var(--fg-muted))]">Your payout methods</p>
        {methods.isLoading && <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Loading…</p>}
        {methods.data && methods.data.paymentMethods.length === 0 && (
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">None saved yet — add one below.</p>
        )}
        {methods.data && methods.data.paymentMethods.length > 0 && (
          <ul className="mt-2 space-y-2">
            {methods.data.paymentMethods.map((m) => (
              <li key={m.id} className="cx-card flex items-center justify-between">
                <span className="text-sm">{m.label}</span>
                {m.isDefault && <span className="cx-badge">Default</span>}
              </li>
            ))}
          </ul>
        )}

        <form
          className="cx-card mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim()) return;
            addMethod.mutate(
              { type, label, last4: last4 || undefined, isDefault: methods.data?.paymentMethods.length === 0 },
              { onSuccess: () => { setLabel(""); setLast4(""); } },
            );
          }}
        >
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["card", "Card"],
                ["mobile_money", "Mobile Money"],
                ["bank_transfer", "Bank transfer"],
              ] as const
            ).map(([id, l]) => (
              <button
                key={id}
                type="button"
                className={`cx-btn cx-btn-sm ${type === id ? "cx-btn-primary" : "cx-btn-secondary"}`}
                onClick={() => setType(id)}
              >
                {l}
              </button>
            ))}
          </div>
          <label className="cx-field">
            <span className="cx-label">Label</span>
            <input
              className="cx-input"
              placeholder={type === "card" ? "Visa" : type === "mobile_money" ? "MTN Mobile Money" : "GTBank"}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </label>
          <label className="cx-field">
            <span className="cx-label">Last 4 digits (optional)</span>
            <input
              className="cx-input"
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              maxLength={4}
            />
          </label>
          <button type="submit" className="cx-btn cx-btn-primary" disabled={addMethod.isPending}>
            {addMethod.isPending ? "Saving…" : "Save payout method"}
          </button>
        </form>
        <p className="mt-3 text-xs text-[hsl(var(--fg-muted))]">
          Only display-safe details (last 4 digits, provider name) are ever stored — never full card or account
          numbers. Payout requests aren't connected to a live processor yet; your method is saved and ready for
          when they are.
        </p>
      </div>
      <InsightPanel tab="payback" />
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
      <InsightPanel tab="faq" />
    </DashboardShell>
  );
}

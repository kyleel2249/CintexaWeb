import { Link } from "wouter";
import { campaignCanonical, isCampaignOpen, type Campaign } from "@/data/campaigns";

/** Feature card on /careers linking to a multi-vacancy campaign page. */
export function CampaignCard({ campaign, now }: { campaign: Campaign; now: Date }) {
  const open = isCampaignOpen(campaign, now);
  const href = new URL(campaignCanonical(campaign)).pathname;
  return (
    <article
      className="mt-8 overflow-hidden rounded-2xl border border-emerald-700/60 bg-[hsl(var(--bg-raised))]"
      aria-labelledby={`${campaign.id}-title`}
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Link href={href} className="block bg-[hsl(var(--bg))]" tabIndex={-1} aria-hidden>
          <img
            src={campaign.image}
            alt=""
            width={campaign.imageWidth}
            height={campaign.imageHeight}
            className="mx-auto h-full max-h-[420px] w-auto object-contain"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
          <ul className="flex flex-wrap items-center gap-1.5" aria-label="Campaign details">
            <li>
              <span className={`cx-badge ${open ? "cx-badge-success" : ""}`}>{open ? "Hiring now" : "Applications closed"}</span>
            </li>
            <li>
              <span className="cx-badge">{campaign.roles.length} vacancies</span>
            </li>
            <li className="text-xs text-[hsl(var(--fg-muted))]">
              {open ? "Deadline" : "Closed"}: {campaign.deadlineLabel}
            </li>
          </ul>
          <h2 id={`${campaign.id}-title`} className="cx-display text-2xl sm:text-3xl">
            <Link href={href} className="hover:underline">
              {campaign.employerName} — {campaign.badge}
            </Link>
          </h2>
          <p className="text-sm leading-relaxed text-[hsl(var(--fg-muted))]">{campaign.introduction}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[hsl(var(--fg))]">
            {campaign.roles.map((r) => (
              <li key={r.id}>{r.title}</li>
            ))}
          </ol>
          <div>
            <Link href={href} className="cx-btn cx-btn-primary cx-btn-sm inline-flex">
              {open ? "View positions & apply" : "View campaign record"}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

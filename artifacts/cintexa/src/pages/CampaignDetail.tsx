import { useEffect } from "react";
import { Link } from "wouter";
import { campaignSeo } from "@/data/campaigns-seo";
import { isCampaignOpen, mailtoUrl, roleMailto, roleSubject, type Campaign } from "@/data/campaigns";
import { applyPageSeo } from "@/lib/seo-dom";
import { trackEvent } from "@/lib/tracking";
import { useNow } from "@/lib/use-now";

const GREEN_BTN =
  "inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
const RED_BTN =
  "inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300";
const DISABLED_BTN =
  "inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[hsl(var(--border))] px-5 py-3 text-sm font-semibold text-[hsl(var(--fg-muted))]";

export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const now = useNow();
  const open = isCampaignOpen(campaign, now);
  useEffect(() => applyPageSeo(campaignSeo(campaign, now)), [campaign, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const track = (placement: string, role?: string) =>
    trackEvent("campaign_apply_email", { campaign: campaign.id, placement, ...(role ? { role } : {}) });

  return (
    <div className="cx-section">
      <div className="cx-container max-w-4xl">
        <nav aria-label="Breadcrumb" className="cx-no-print text-xs text-[hsl(var(--fg-muted))]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[hsl(var(--fg))]">Home</Link></li>
            <li aria-hidden>›</li>
            <li><Link href="/careers" className="hover:text-[hsl(var(--fg))]">Careers</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-[hsl(var(--fg))]">{campaign.employerName} Job Alert</li>
          </ol>
        </nav>

        {/* A. Hero */}
        <header className="mt-6 grid items-start gap-8 md:grid-cols-[minmax(0,340px)_1fr]">
          <a href={campaign.image} target="_blank" rel="noopener noreferrer" aria-label="Open the full-size recruitment poster in a new tab" className="mx-auto block w-full max-w-[340px]">
            <img
              src={campaign.image}
              alt={campaign.imageAlt}
              width={campaign.imageWidth}
              height={campaign.imageHeight}
              className="h-auto w-full rounded-2xl border border-[hsl(var(--border))]"
              decoding="async"
              fetchPriority="high"
            />
          </a>
          <div>
            <p className="inline-block rounded-md bg-red-600 px-3 py-1 text-sm font-extrabold tracking-widest text-white">{campaign.badge}</p>
            <h1 className="cx-display mt-3 text-3xl sm:text-4xl">{campaign.headline}</h1>
            <p className="mt-2 text-xl font-semibold text-emerald-400">{campaign.subheadline}</p>
            <p className="mt-4 leading-relaxed text-[hsl(var(--fg-muted))]">{campaign.openingCopy}</p>
            <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
              <strong className="text-[hsl(var(--fg))]">{campaign.employerName}</strong> is the recruiting organisation (
              <a href={campaign.employerUrl} target="_blank" rel="noopener noreferrer" className="underline">tobincopharma.com</a>
              ). CINTEXA publishes this listing on its Careers platform.
            </p>

            <p
              className={`mt-5 rounded-xl border px-4 py-3 text-base font-semibold ${open ? "border-emerald-700 text-[hsl(var(--fg))]" : "border-red-600 text-red-300"}`}
              role="status"
            >
              {open ? `Application Deadline: ${campaign.deadlineLabel}` : `Applications closed on ${campaign.deadlineLabel}`}
            </p>

            <div className="cx-no-print mt-5 flex flex-wrap gap-3">
              {open ? (
                <>
                  <a href="#how-to-apply" className={RED_BTN} onClick={() => track("hero")}>Apply Now!</a>
                  <a href="#positions" className={GREEN_BTN}>View Available Positions</a>
                </>
              ) : (
                <button type="button" className={DISABLED_BTN} disabled aria-disabled="true">Applications closed</button>
              )}
            </div>
          </div>
        </header>

        {/* D. Overview */}
        <section className="mt-12" aria-labelledby="overview-title">
          <h2 id="overview-title" className="cx-display text-2xl">Recruitment overview</h2>
          <p className="mt-3 leading-relaxed text-[hsl(var(--fg-muted))]">{campaign.introduction}</p>
          <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
            Detailed role descriptions and eligibility requirements were not published with the poster. For more
            information about a position, contact the employer at{" "}
            <a href={mailtoUrl(campaign.applyEmail)} className="underline">{campaign.applyEmail}</a> or visit{" "}
            <a href={campaign.employerUrl} target="_blank" rel="noopener noreferrer" className="underline">tobincopharma.com</a>.
          </p>
        </section>

        {/* C. Positions */}
        <section id="positions" className="mt-12 scroll-mt-24" aria-labelledby="positions-title">
          <h2 id="positions-title" className="cx-display text-2xl">Open positions</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {campaign.roles.map((role, i) => (
              <li key={role.id}>
                <article className="flex h-full flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-5" aria-labelledby={`${role.id}-title`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white" aria-hidden>{i + 1}</span>
                  <h3 id={`${role.id}-title`} className="cx-display mt-3 text-lg">{role.title}</h3>
                  <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{campaign.employerName} · Deadline: {campaign.deadlineLabel}</p>
                  <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                    Role description and requirements: not published with the poster. Ask the employer for details.
                  </p>
                  <div className="cx-no-print mt-4 pt-1">
                    {open ? (
                      <a
                        href={roleMailto(campaign, role)}
                        className={RED_BTN}
                        aria-label={`Apply Now for ${role.title} by email`}
                        onClick={() => track("role_card", role.id)}
                      >
                        Apply Now!
                      </a>
                    ) : (
                      <button type="button" className={DISABLED_BTN} disabled aria-disabled="true" aria-label={`Applications for ${role.title} are closed`}>
                        Applications closed
                      </button>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>

        {/* E. How to apply */}
        <section id="how-to-apply" className="mt-12 scroll-mt-24 rounded-2xl border border-emerald-700/60 bg-[hsl(var(--bg-raised))] p-6" aria-labelledby="how-title">
          <h2 id="how-title" className="cx-display text-2xl">How to Apply</h2>
          <p className="mt-3 leading-relaxed text-[hsl(var(--fg))]">{campaign.applyInstructions}</p>
          <p className="mt-4 break-words text-xl font-bold text-emerald-400">
            <a href={mailtoUrl(campaign.applyEmail)} className="underline">{campaign.applyEmail}</a>
          </p>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[hsl(var(--fg-muted))]">
            <li>Prepare an up-to-date CV.</li>
            <li>Prepare a cover letter.</li>
            <li>Identify the specific position you are applying for.</li>
            <li>Email both documents to {campaign.applyEmail}.</li>
            <li>Indicate the position you are applying for in the email subject line.</li>
            <li>Submit your application before {campaign.deadlineLabel}.</li>
          </ol>
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[hsl(var(--fg))]">Subject line for each position</h3>
            <ul className="mt-2 space-y-1 text-sm text-[hsl(var(--fg-muted))]">
              {campaign.roles.map((r) => (
                <li key={r.id}>{r.title}: “{roleSubject(r)}”</li>
              ))}
            </ul>
          </div>
          <p className="mt-5 rounded-lg border border-amber-500/50 px-3 py-2 text-sm text-[hsl(var(--fg))]">
            Attach your CV and cover letter yourself before sending. The button only opens your email app with the
            recipient and subject filled in.
          </p>
          <div className="cx-no-print mt-5">
            {open ? (
              <a href={mailtoUrl(campaign.applyEmail)} className={RED_BTN} onClick={() => track("how_to_apply")}>Email Your Application</a>
            ) : (
              <p className="text-sm font-semibold text-red-300">Applications closed on {campaign.deadlineLabel}.</p>
            )}
            <p className="mt-3 text-xs text-[hsl(var(--fg-muted))]">
              If the button does not open your email app, copy the address <strong>{campaign.applyEmail}</strong> and
              write to it from your email account.
            </p>
          </div>
        </section>

        {/* G. Safety */}
        <section className="mt-10" aria-labelledby="safety-title">
          <h2 id="safety-title" className="cx-display text-xl">Recruitment safety</h2>
          <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--fg-muted))]">
            Confirm recruitment information through the employer’s official channels (
            <a href={campaign.employerUrl} target="_blank" rel="noopener noreferrer" className="underline">tobincopharma.com</a>
            ). Be cautious of anyone who asks you to pay a recruitment or application fee, and only send documents to
            the address shown above.
          </p>
        </section>

        {/* H. Final CTA */}
        <section className="cx-no-print mt-10 rounded-2xl bg-emerald-900/40 p-6 text-center">
          <h2 className="cx-display text-2xl">{open ? "Interested and Qualified? Apply Now!" : "This recruitment has closed"}</h2>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
            {open ? `Deadline: ${campaign.deadlineLabel}` : `Applications closed on ${campaign.deadlineLabel}. See other vacancies on CINTEXA Careers.`}
          </p>
          <div className="mt-4">
            {open ? (
              <a href="#how-to-apply" className={RED_BTN} onClick={() => track("final_cta")}>Apply Now!</a>
            ) : (
              <Link href="/careers" className={GREEN_BTN}>View open roles</Link>
            )}
          </div>
        </section>

        <p className="mt-8 text-xs text-[hsl(var(--fg-muted))]">
          <Link href="/careers" className="underline hover:text-[hsl(var(--fg))]">All vacancies &amp; alerts</Link>
        </p>
      </div>
    </div>
  );
}

export default CampaignDetail;

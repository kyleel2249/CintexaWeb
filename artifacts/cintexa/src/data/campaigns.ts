/**
 * Multi-vacancy recruitment campaigns (one employer, several roles, one shared poster and
 * application route). The ONE source of truth is `campaigns.json`; the campaign page, the
 * /careers feature card, prerendered HTML (SEO + Open Graph) and sitemap.xml all derive from it.
 *
 * Applications are by email only — nothing here collects or stores CVs.
 */
import campaignsData from "./campaigns.json";

export type CampaignRole = { id: string; title: string };

export type Campaign = {
  id: string;
  slug: string;
  employerName: string;
  employerUrl: string;
  badge: string;
  headline: string;
  subheadline: string;
  pageTitle: string;
  socialTitle: string;
  description: string;
  introduction: string;
  openingCopy: string;
  applyInstructions: string;
  applyEmail: string;
  /** ISO date (YYYY-MM-DD); applications are open through the end of this day. */
  deadline: string;
  deadlineLabel: string;
  datePosted: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  /** "closed" lets an administrator withdraw the campaign before its deadline. */
  status: "open" | "closed";
  roles: CampaignRole[];
};

export const CAMPAIGNS: Campaign[] = campaignsData as Campaign[];

/** Open = not withdrawn and the deadline day has not finished. A lapsed campaign is shown as closed, never removed. */
export function isCampaignOpen(campaign: Campaign, now: Date = new Date()): boolean {
  if (campaign.status !== "open") return false;
  const end = new Date(`${campaign.deadline}T23:59:59Z`);
  return Number.isNaN(end.getTime()) || end.getTime() >= now.getTime();
}

/** Campaigns are kept for reference after they close, so lookup does not depend on the deadline. */
export function getCampaignBySlug(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.slug === slug);
}

export function campaignCanonical(campaign: Pick<Campaign, "slug">): string {
  return `https://cintexa.com/careers/${campaign.slug}`;
}

export function roleSubject(role: CampaignRole): string {
  return `Application for ${role.title}`;
}

/** Correctly percent-encoded mailto: link (spaces → %20, "&" → %26) so no subject text is lost. */
export function mailtoUrl(email: string, subject?: string): string {
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

export function roleMailto(campaign: Campaign, role: CampaignRole): string {
  return mailtoUrl(campaign.applyEmail, roleSubject(role));
}

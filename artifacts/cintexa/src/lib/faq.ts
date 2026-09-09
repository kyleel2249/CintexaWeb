import type { CustomerRole } from "@cintexa/db/schema";

export interface FaqEntry {
  question: string;
  answer: string;
  /** Roles this entry is especially relevant to — shown first for those users. Omitted = relevant to everyone. */
  roles?: CustomerRole[];
  /** Onboarding interest strings this entry is tied to — shown first if the person picked any of these. */
  interests?: string[];
}

export const FAQ_ENTRIES: FaqEntry[] = [
  // General
  { question: "How do I change my plan?", answer: "Go to Pricing and choose a new plan — it takes effect immediately." },
  { question: "Where do I see my loyalty points?", answer: "Your balance is on the Dashboard Overview tab, with full history under Progress." },
  { question: "How do I show up on the leaderboard?", answer: "Turn on \"Show me on the public leaderboard\" in Settings." },
  { question: "How do I change my username, photo, or set up two-factor authentication?", answer: "All under Settings → Account & security." },
  { question: "What happens to my data if I delete my account?", answer: "Contact support — account deletion removes your profile and stops future billing." },

  // Creator
  { question: "How do I grow an audience for my content?", answer: "Start with Marketing technology for channel planning, then Ads Boost to promote specific pieces.", roles: ["creator"], interests: ["Content & media", "Courses & education"] },
  { question: "Can I sell a course or digital product?", answer: "Yes — the E-commerce module supports digital delivery alongside physical products.", roles: ["creator"], interests: ["Software & tools"] },

  // Seller
  { question: "How do I list a physical product?", answer: "The E-commerce module covers catalog, checkout, and a 3D storefront demo.", roles: ["seller"], interests: ["Physical products"] },
  { question: "Do you support subscription billing for my own customers?", answer: "The platform's own subscriptions module (Pricing page) shows the pattern — a customer-facing version is on the roadmap.", roles: ["seller"], interests: ["Subscriptions"] },

  // Buyer
  { question: "How do I compare modules before committing?", answer: "The Platform page lists every module and whether it's Available or still Foundation.", roles: ["buyer"], interests: ["Analytics & BI"] },
  { question: "Can I try Ads Boost before switching my whole campaign over?", answer: "Yes — Ads Boost works alongside your existing channels, it doesn't require migrating everything at once.", roles: ["buyer"], interests: ["Ad campaigns"] },

  // Affiliate
  { question: "Where's my referral link?", answer: "Your unique link is on the Affiliate tab in your dashboard, with a one-click copy button.", roles: ["affiliate"] },
  { question: "How much commission do I earn, and when do I get paid?", answer: "Commission rate depends on your partner agreement. Add a payout method in Settings so we know where to send it once a sale attributed to you is confirmed.", roles: ["affiliate"], interests: ["Commission tracking"] },
  { question: "Can I promote more than one product?", answer: "Yes — your referral link works across every product and plan on the platform.", roles: ["affiliate"], interests: ["Product promotion"] },

  // Payments (everyone)
  { question: "What payment methods do you support?", answer: "Cards, mobile money, and bank transfer. Add or manage these under Settings → Payment methods." },
  { question: "Is there a platform fee?", answer: "Yes — a 5% platform fee applies to every sale or payment processed through CINTEXA. You keep the remaining 95%." },
];

/** Sorts entries so ones matching the person's role or interests come first, preserving relative order within each group. */
export function getSortedFaq(role: CustomerRole | null | undefined, interests: string[]): FaqEntry[] {
  const interestSet = new Set(interests);
  const score = (entry: FaqEntry) => {
    const roleMatch = role && entry.roles?.includes(role);
    const interestMatch = entry.interests?.some((i) => interestSet.has(i));
    if (roleMatch && interestMatch) return 0;
    if (roleMatch) return 1;
    if (interestMatch) return 1;
    if (!entry.roles && !entry.interests) return 2;
    return 3;
  };
  return [...FAQ_ENTRIES].sort((a, b) => score(a) - score(b));
}

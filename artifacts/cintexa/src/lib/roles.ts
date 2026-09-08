import type { CustomerRole } from "@cintexa/db/schema";
import { ROLE_INTEREST_OPTIONS, USAGE_FREQUENCY_OPTIONS } from "@cintexa/db/schema";

export { ROLE_INTEREST_OPTIONS, USAGE_FREQUENCY_OPTIONS };

/** UI-only metadata per role — the actual interest options come from @cintexa/db so
 * frontend and backend validation never drift. */
export const ROLE_META: Record<CustomerRole, { label: string; blurb: string; color: string }> = {
  creator: { label: "Creator", blurb: "You make things — content, products, or tools for others.", color: "violet" },
  seller: { label: "Seller", blurb: "You sell products or services and want to grow revenue.", color: "accent" },
  buyer: { label: "Buyer", blurb: "You're evaluating tools and services to bring in.", color: "sky" },
  consumer: { label: "Consumer", blurb: "You use CINTEXA products and want rewards, updates, and deals.", color: "teal" },
};

export const ROLE_ORDER: CustomerRole[] = ["creator", "seller", "buyer", "consumer"];

interface Recommendation {
  title: string;
  description: string;
  href: string;
}

/** Maps a single onboarding interest answer to a concrete page on the site — this is
 * what makes the dashboard genuinely tailored rather than just labeled with a role. */
const INTEREST_RECOMMENDATIONS: Record<string, Recommendation> = {
  "Content & media": { title: "Marketing technology", description: "Plan and schedule content across channels.", href: "/solutions/marketing" },
  "Software & tools": { title: "Platform overview", description: "See every module your audience could use.", href: "/platform" },
  "Courses & education": { title: "Marketing technology", description: "Build a content calendar for launches.", href: "/solutions/marketing" },
  "Art & design": { title: "Ads Boost", description: "Get your work in front of more people.", href: "/solutions/ads-boost" },
  "Music & audio": { title: "Ads Boost", description: "Run a campaign lifecycle for a release.", href: "/solutions/ads-boost" },
  "Physical products": { title: "E-commerce", description: "Catalog, checkout, and a 3D storefront demo.", href: "/solutions/ecommerce" },
  "Digital products": { title: "E-commerce", description: "Set up delivery and checkout for digital goods.", href: "/solutions/ecommerce" },
  Services: { title: "Sales technology", description: "Track leads from first visit to booked call.", href: "/solutions/sales" },
  Subscriptions: { title: "Pricing", description: "See how plans and entitlements are structured.", href: "/pricing" },
  "Marketing tools": { title: "Marketing technology", description: "Explore the channel toolkit.", href: "/solutions/marketing" },
  "E-commerce tools": { title: "E-commerce", description: "Explore the commerce toolkit.", href: "/solutions/ecommerce" },
  "Ad campaigns": { title: "Ads Boost", description: "See the campaign lifecycle view.", href: "/solutions/ads-boost" },
  "Analytics & BI": { title: "Platform overview", description: "See what's available today vs. on the roadmap.", href: "/platform" },
  "Product updates": { title: "Platform overview", description: "Track what's shipped across every module.", href: "/platform" },
  "Community & rewards": { title: "Leaderboard", description: "See where you rank and opt in from Settings.", href: "/dashboard/leaderboard" },
  "Deals & discounts": { title: "Pricing", description: "Compare plans and what's included.", href: "/pricing" },
  "Educational content": { title: "Marketing technology", description: "See how the content pipeline works.", href: "/solutions/marketing" },
};

/** Deduplicates by destination page, in case multiple interests point at the same place. */
export function getRecommendations(interests: string[]): Recommendation[] {
  const seen = new Set<string>();
  const results: Recommendation[] = [];
  for (const interest of interests) {
    const rec = INTEREST_RECOMMENDATIONS[interest];
    if (rec && !seen.has(rec.href)) {
      seen.add(rec.href);
      results.push(rec);
    }
  }
  return results;
}

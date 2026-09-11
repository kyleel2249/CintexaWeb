/** FAQ entries tailored to onboarding interests / role. */

const BY_INTEREST: Record<string, { q: string; a: string }[]> = {
  "Content & media": [
    { q: "How do I publish content templates?", a: "Open Dashboard → Templates, pick a content kit, and adapt it to your brand voice." },
    { q: "Can I schedule posts?", a: "Use Dashboard → Social to connect networks, schedule posts, and boost ads. Share links work across platforms." },
  ],
  "Digital products": [
    { q: "How are sales fees calculated?", a: "Platform fee is a percentage of each sale. Default is 7%; apply promo FREE2026 for 5%. Processor costs are separate." },
    { q: "Which payout methods are supported?", a: "Cards, Mobile Money, and bank transfer are available under Payback." },
  ],
  "Affiliate links & referrals": [
    { q: "Where is my affiliate link?", a: "Dashboard → Affiliate shows your real referral link — anyone who signs up through it is attributed to you." },
    { q: "How do commissions appear?", a: "Affiliate earnings show net of the active platform fee percentage on attributed sales." },
  ],
  "Ad campaigns": [
    { q: "How do Facebook pixels work here?", a: "Dashboard → Pixels lets you store Pixel IDs. Firing respects your marketing cookie consent." },
    { q: "Can I track conversions?", a: "Yes — pair Pixels with Analytics for funnel views from impression to sale." },
  ],
  "Analytics & BI": [
    { q: "What does Analytics show?", a: "Traffic, conversion, and revenue snapshots tailored to the interests you selected at onboarding." },
  ],
  default: [
    { q: "How do I change my username or avatar?", a: "Go to Dashboard → Settings. Username binds to your account on this device and syncs when the API is available." },
    { q: "How do I enable two-factor authentication?", a: "Settings → Security opens your account security center for TOTP / 2FA." },
    { q: "How do I export or delete my data?", a: "Settings → Privacy: export downloads a JSON file; delete asks for confirmation then clears local data and requests server deletion." },
    { q: "What is the platform fee?", a: "Platform fee is a percentage of each sale. Default is 7%; apply promo FREE2026 for 5%. Starter has a 0% subscription charge." },
  ],
};

export function faqForInterests(interests: string[] = []) {
  const seen = new Set<string>();
  const out: { q: string; a: string }[] = [];
  for (const interest of interests) {
    for (const item of BY_INTEREST[interest] ?? []) {
      if (!seen.has(item.q)) {
        seen.add(item.q);
        out.push(item);
      }
    }
  }
  for (const item of BY_INTEREST.default) {
    if (!seen.has(item.q)) {
      seen.add(item.q);
      out.push(item);
    }
  }
  return out;
}

/**
 * CINTEXA ELSIM SEO Keyword Master Map
 * Primary → Secondary → Long-tail → Page → H1 → Meta → URL → ALT
 */

export type SeoPageEntry = {
  path: string;
  primary: string[];
  secondary: string[];
  longTail: string[];
  h1: string;
  metaTitle: string;
  metaDescription: string;
  imageAlt: string[];
  ogImage?: string;
  schemaType?: "Organization" | "Service" | "JobPosting" | "CollectionPage" | "WebPage" | "ContactPage";
  noIndex?: boolean;
};

export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&h=630&q=80";

export const SEO_MASTER_MAP: SeoPageEntry[] = [
  {
    path: "/",
    primary: ["CINTEXA", "connected technology systems", "business growth platform"],
    secondary: [
      "digital commerce platform",
      "sales marketing technology platform",
      "lead generation platform",
      "technology for modern businesses",
    ],
    longTail: [
      "technology that helps businesses sell and grow",
      "platform for sales marketing and ecommerce",
      "sell market and grow",
      "convert visitors into customers",
    ],
    h1: "Technology That Helps Your Business Sell, Market & Grow",
    metaTitle: "CINTEXA | Connected Technology Systems for Sales, Marketing & Growth",
    metaDescription:
      "CINTEXA is a business growth platform for sales, marketing, ecommerce and digital commerce. Lead generation, automation and customer accounts in one connected core.",
    imageAlt: [
      "CINTEXA connected technology systems for modern businesses",
      "business growth platform dashboard",
      "digital commerce and marketing technology",
    ],
    schemaType: "Organization",
  },
  {
    path: "/platform",
    primary: ["connected core platform", "SaaS business platform"],
    secondary: [
      "customer accounts dashboard",
      "customer dashboard",
      "business automation software",
      "subscription ready platform",
      "AI business insights",
    ],
    longTail: [
      "digital business systems",
      "intelligent software for business",
      "cloud infrastructure for companies",
      "scale your business online",
    ],
    h1: "SaaS Business Platform & Connected Core for Growth",
    metaTitle: "SaaS Business Platform & Customer Dashboard | CINTEXA",
    metaDescription:
      "CINTEXA SaaS business platform: customer dashboard, contribution tracking, progress tracking, loyalty and CRM foundation in one connected system.",
    imageAlt: [
      "CINTEXA customer dashboard",
      "SaaS business platform interface",
      "contribution and progress tracking",
    ],
    schemaType: "WebPage",
  },
  {
    path: "/solutions/sales",
    primary: ["sales technology", "lead generation platform"],
    secondary: [
      "lead capture software",
      "sales pipeline management",
      "deal tracking software",
      "sales analytics",
      "conversion tracking",
      "sales forecasting tools",
      "customer segmentation sales",
    ],
    longTail: ["software to manage sales pipeline", "how to generate leads with digital systems"],
    h1: "Sales Technology for Lead Capture, Pipeline & Conversion",
    metaTitle: "Sales Technology & Lead Generation Platform | CINTEXA",
    metaDescription:
      "Sales technology with lead capture software, sales pipeline management, deal tracking, conversion tracking and sales analytics to convert visitors into customers.",
    imageAlt: [
      "sales pipeline management software",
      "lead capture and conversion tracking",
      "sales analytics dashboard",
    ],
    schemaType: "Service",
  },
  {
    path: "/solutions/marketing",
    primary: ["marketing technology", "marketing automation"],
    secondary: [
      "campaign management software",
      "email marketing system",
      "audience targeting",
      "marketing analytics",
      "retargeting infrastructure",
      "customer engagement platform",
    ],
    longTail: ["marketing infrastructure for small businesses"],
    h1: "Marketing Technology & Automation That Attracts Customers",
    metaTitle: "Marketing Technology & Campaign Automation | CINTEXA",
    metaDescription:
      "Marketing technology for campaign management, email marketing, audience targeting, retargeting and marketing analytics to engage and retain customers.",
    imageAlt: [
      "marketing automation campaign dashboard",
      "email marketing system",
      "audience targeting analytics",
    ],
    schemaType: "Service",
  },
  {
    path: "/solutions/ecommerce",
    primary: ["ecommerce platform", "digital store builder"],
    secondary: [
      "online store technology",
      "product catalog software",
      "shopping cart checkout system",
      "order tracking software",
      "ecommerce analytics",
    ],
    longTail: ["build an online store for African businesses", "digital commerce platform for growing companies"],
    h1: "Ecommerce Platform & Digital Store Technology",
    metaTitle: "Ecommerce Platform & Online Store Technology | CINTEXA",
    metaDescription:
      "Ecommerce platform with product catalog, shopping cart checkout, order tracking and ecommerce analytics so businesses can sell online and scale.",
    imageAlt: [
      "ecommerce platform storefront",
      "digital store builder",
      "online product catalog and checkout",
    ],
    schemaType: "Service",
  },
  {
    path: "/solutions/ads-boost",
    primary: ["digital advertising platform", "ads boost"],
    secondary: [
      "ad campaign management",
      "performance marketing tools",
      "ROI advertising reporting",
      "click and conversion tracking",
    ],
    longTail: ["digital advertising for growing companies", "performance marketing with ROI reporting"],
    h1: "Ads Boost — Digital Advertising Platform for Campaigns",
    metaTitle: "Digital Advertising Platform & Ads Boost | CINTEXA",
    metaDescription:
      "Ads Boost digital advertising platform: campaign management, click and conversion tracking, performance marketing tools and ROI advertising reporting.",
    imageAlt: [
      "digital advertising campaign dashboard",
      "ads boost performance marketing",
      "ROI advertising reporting",
    ],
    schemaType: "Service",
  },
  {
    path: "/solutions/website-development",
    primary: ["website development company", "custom website development"],
    secondary: ["high performance websites", "business website design", "web application development"],
    longTail: ["custom websites for business growth", "high performance websites for modern businesses"],
    h1: "Custom Website Development & High-Performance Web Apps",
    metaTitle: "Website Development Company & Custom Websites | CINTEXA",
    metaDescription:
      "Website development company building custom websites, business website design and high performance web applications that support sales and growth.",
    imageAlt: [
      "custom website development",
      "high performance business website",
      "web application interface",
    ],
    schemaType: "Service",
  },
  {
    path: "/solutions/software-development",
    primary: ["custom software development", "business software solutions"],
    secondary: [
      "software for growing companies",
      "bespoke business applications",
      "business operations automation",
      "inventory management software",
    ],
    longTail: ["intelligent software for business", "IT solutions for business assessment and growth"],
    h1: "Custom Software Development for Growing Companies",
    metaTitle: "Custom Software Development & Business Software | CINTEXA",
    metaDescription:
      "Custom software development and business software solutions: bespoke applications, operations automation and systems that help companies scale.",
    imageAlt: [
      "custom software development",
      "business software solutions",
      "bespoke business applications",
    ],
    schemaType: "Service",
  },
  {
    path: "/pricing",
    primary: ["CINTEXA pricing", "platform fee"],
    secondary: ["get started", "subscription ready platform", "business growth platform pricing"],
    longTail: ["affordable platform fee for growing businesses"],
    h1: "Simple Platform Pricing to Start Growing",
    metaTitle: "Pricing & Platform Fee | Get Started with CINTEXA",
    metaDescription:
      "CINTEXA pricing for a subscription-ready SaaS business platform. Start with a clear platform fee and scale sales, marketing and ecommerce tools.",
    imageAlt: ["CINTEXA pricing plans", "platform fee for business growth"],
    schemaType: "WebPage",
  },
  {
    path: "/get-started",
    primary: ["get started CINTEXA"],
    secondary: ["create account", "customer accounts dashboard", "lead generation platform"],
    longTail: ["create your CINTEXA account and start growing"],
    h1: "Get Started with CINTEXA — Create Your Account",
    metaTitle: "Get Started | Create Account on CINTEXA",
    metaDescription:
      "Get started with CINTEXA. Create your account for the customer dashboard, lead tools and business growth platform.",
    imageAlt: ["get started with CINTEXA", "create customer account dashboard"],
    schemaType: "WebPage",
  },
  {
    path: "/sign-in",
    primary: ["sign in CINTEXA"],
    secondary: ["customer dashboard"],
    longTail: [],
    h1: "Sign in to CINTEXA",
    metaTitle: "Sign In | CINTEXA",
    metaDescription: "Sign in to your CINTEXA customer dashboard and growth tools.",
    imageAlt: ["sign in to CINTEXA dashboard"],
    schemaType: "WebPage",
    noIndex: true,
  },
  {
    path: "/sign-up",
    primary: ["sign up CINTEXA"],
    secondary: ["create account", "get started"],
    longTail: [],
    h1: "Create your CINTEXA account",
    metaTitle: "Sign Up | CINTEXA",
    metaDescription: "Create your CINTEXA account for the business growth platform and customer dashboard.",
    imageAlt: ["sign up for CINTEXA"],
    schemaType: "WebPage",
    noIndex: true,
  },
  {
    path: "/contact",
    primary: ["contact CINTEXA"],
    secondary: ["info@cintexa.com", "business technology company Ghana"],
    longTail: ["contact CINTEXA for website and software development"],
    h1: "Contact CINTEXA",
    metaTitle: "Contact CINTEXA | info@cintexa.com",
    metaDescription:
      "Contact CINTEXA for sales, marketing, ecommerce, website and software development. Email info@cintexa.com or message us on WhatsApp.",
    imageAlt: ["contact CINTEXA team", "business technology company support"],
    schemaType: "ContactPage",
  },
  {
    path: "/careers",
    primary: ["careers Ghana", "jobs and scholarships Ghana"],
    secondary: ["job vacancy Ghana apply now", "job alert Ghana", "full time cleaner job"],
    longTail: ["WhatsApp job application Ghana", "jobs and scholarships alerts"],
    h1: "Careers & Job Vacancies in Ghana — Apply Now",
    metaTitle: "Careers & Jobs in Ghana | Job Alerts & Scholarships — CINTEXA",
    metaDescription:
      "Careers Ghana: open job vacancies including cleaner jobs, scholarships and job alerts. Apply by call or WhatsApp. Sign up for job alerts.",
    imageAlt: [
      "careers Ghana job vacancies",
      "jobs and scholarships Ghana",
      "job alert signup",
    ],
    schemaType: "CollectionPage",
  },
  {
    path: "/careers/cleaner",
    primary: ["cleaner job vacancy Ghana"],
    secondary: ["cleaner jobs in Ghana", "full time cleaner job", "job vacancy Ghana apply now"],
    longTail: ["WhatsApp job application Ghana", "available and dedicated cleaner Ghana"],
    h1: "Cleaner Job Vacancy in Ghana — Apply Now",
    metaTitle: "Cleaner Job Vacancy in Ghana — Apply Now | Careers",
    metaDescription:
      "Cleaner job vacancy in Ghana. Full-time role for available and dedicated candidates. Call or WhatsApp +233 59 516 8610 to apply now.",
    imageAlt: [
      "cleaner job vacancy Ghana",
      "professional cleaner in modern office",
      "full time cleaner job apply now",
    ],
    ogImage: "https://cintexa.com/careers/cleaner-job-vacancy.jpeg",
    schemaType: "JobPosting",
  },
  {
    path: "/dashboard",
    primary: ["customer dashboard"],
    secondary: [],
    longTail: [],
    h1: "Dashboard",
    metaTitle: "Dashboard | CINTEXA",
    metaDescription: "Your CINTEXA customer dashboard.",
    imageAlt: [],
    noIndex: true,
  },
];

const byPath = new Map(SEO_MASTER_MAP.map((e) => [e.path, e]));

/** Resolve SEO entry for a pathname (exact, then prefix for /careers/:slug). */
export function getSeoForPath(pathname: string): SeoPageEntry {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (byPath.has(clean)) return byPath.get(clean)!;
  if (clean.startsWith("/careers/") && clean !== "/careers") {
    return (
      byPath.get(clean) ||
      byPath.get("/careers") ||
      byPath.get("/")!
    );
  }
  if (clean.startsWith("/dashboard") || clean.startsWith("/admin")) {
    return {
      path: clean,
      primary: [],
      secondary: [],
      longTail: [],
      h1: "CINTEXA",
      metaTitle: "CINTEXA",
      metaDescription: "CINTEXA account area.",
      imageAlt: [],
      noIndex: true,
    };
  }
  return byPath.get("/")!;
}

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `https://cintexa.com${p === "/" ? "/" : p}`;
}

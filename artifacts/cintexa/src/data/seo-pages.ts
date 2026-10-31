/**
 * Central SEO registry for every static public page, plus builders for blog pages.
 *
 * `staticPageSeo(path)` returns the same `PageSeoData` shape the careers / case-study / web-design builders use, so
 * `applyPageSeo()` (browser) and `injectHead()` (build-time prerender) handle every page identically. The JSON-LD is
 * generated here — never hand-written per page — from site-entity.ts + seo-schema.ts + page-content.ts.
 *
 * Adding a page: add an entry to STATIC_PAGES (+ a Route in App.tsx). The prerender, sitemap check, llms.txt and
 * breadcrumbs pick it up; `scripts/check-seo.mjs` fails the build if a route is left without prerendered HTML.
 *
 * Note on "HomePage": schema.org has no `HomePage` type (the prompt's list is a common misconception), so the home
 * page is a `WebPage` whose `about` is the Organization. `AboutPage` and `ContactPage` DO exist and are used.
 */
import type { PageSeoData } from "./careers-seo";
import { HOME_FAQS, SOLUTION_CONTENT } from "./page-content";
import {
  blogPostingNode,
  breadcrumbNode,
  faqNode,
  graph,
  itemListNode,
  organizationNode,
  serviceNode,
  webPageNode,
  websiteNode,
  type Crumb,
  type Faq,
  type JsonLdNode,
  type WebPageType,
} from "./seo-schema";
import { ENTITY, SERVICES, SITE_URL, abs, type ServiceEntry } from "./site-entity";

export const ROBOTS_INDEX = "index, follow, max-image-preview:large";
export const ROBOTS_NOINDEX = "noindex, follow";

export type StaticPage = {
  path: string;
  title: string;
  /** Shorter title for og:title / twitter:title. */
  socialTitle: string;
  description: string;
  h1: string;
  kind: WebPageType;
  /** Trail AFTER "Home" (Home is always first). Empty for the home page. */
  crumbs: Crumb[];
  faqs?: Faq[];
  service?: ServiceEntry;
  /** ISO date of the last real content change, only where one is known. */
  updated?: string;
  /** Primary search intent, documented for editors (not rendered). */
  intent: "navigational" | "commercial" | "informational" | "transactional";
};

const SOLUTIONS_CRUMB: Crumb = { name: "Solutions", path: "/platform" };
const svc = (id: ServiceEntry["id"]) => SERVICES.find((s) => s.id === id)!;
const solutionCrumbs = (s: ServiceEntry): Crumb[] => [SOLUTIONS_CRUMB, { name: s.name, path: s.path }];

export const STATIC_PAGES: StaticPage[] = [
  {
    path: "/",
    title: "CINTEXA | Software, Websites & Business Automation in Ghana",
    socialTitle: "CINTEXA — Software, Websites & Business Automation",
    description:
      "CINTEXA builds custom software, websites, e-commerce and business automation for growing businesses in Ghana and beyond. Tell us what you want to improve.",
    h1: "Technology that helps your business understand, improve, and grow.",
    kind: "WebPage",
    crumbs: [],
    faqs: HOME_FAQS,
    intent: "navigational",
  },
  {
    path: "/about",
    title: "About CINTEXA | Technology & Digital Business Solutions",
    socialTitle: "About CINTEXA",
    description:
      "Who CINTEXA is, what it builds, who it serves and how it works: practical software, websites and automation for businesses in Ghana and beyond.",
    h1: "Technology and digital systems built around real business needs",
    kind: "AboutPage",
    crumbs: [{ name: "About", path: "/about" }],
    intent: "informational",
  },
  {
    path: "/platform",
    title: "CINTEXA Solutions | Software, Web, E-commerce & Automation",
    socialTitle: "CINTEXA Solutions",
    description:
      "Custom software, web design, e-commerce, marketing and sales technology, advertising and business automation from CINTEXA, with answers to common questions.",
    h1: "Software, websites, e-commerce and automation for growing businesses",
    kind: "CollectionPage",
    crumbs: [SOLUTIONS_CRUMB],
    faqs: SOLUTION_CONTENT.platform.faqs,
    intent: "commercial",
  },
  {
    path: svc("software-development").path,
    title: "Custom Software Development & Business Software | CINTEXA",
    socialTitle: "Custom Software Development — CINTEXA",
    description:
      "CINTEXA designs and builds custom business software: internal tools, customer applications, APIs and integrations agreed in writing with clear milestones.",
    h1: "Custom Software Development for Growing Companies",
    kind: "WebPage",
    crumbs: solutionCrumbs(svc("software-development")),
    faqs: SOLUTION_CONTENT["software-development"].faqs,
    service: svc("software-development"),
    intent: "commercial",
  },
  {
    path: svc("marketing").path,
    title: "Marketing Technology & Campaign Automation | CINTEXA",
    socialTitle: "Marketing Technology — CINTEXA",
    description:
      "Marketing technology from CINTEXA: plan campaigns, email, social, search and content around one calendar and measure which activity brings enquiries.",
    h1: "Marketing Technology & Automation That Attracts Customers",
    kind: "WebPage",
    crumbs: solutionCrumbs(svc("marketing")),
    faqs: SOLUTION_CONTENT.marketing.faqs,
    service: svc("marketing"),
    intent: "commercial",
  },
  {
    path: svc("sales").path,
    title: "Sales Technology & Lead Management | CINTEXA",
    socialTitle: "Sales Technology — CINTEXA",
    description:
      "Capture leads, track every enquiry through a clear pipeline and make sure each one has an owner and a next step. Sales technology and CRM setup from CINTEXA.",
    h1: "Sales Technology for Lead Capture, Pipeline & Conversion",
    kind: "WebPage",
    crumbs: solutionCrumbs(svc("sales")),
    faqs: SOLUTION_CONTENT.sales.faqs,
    service: svc("sales"),
    intent: "commercial",
  },
  {
    path: svc("ads-boost").path,
    title: "Ads Boost | Digital Advertising Campaigns by CINTEXA",
    socialTitle: "Ads Boost — Digital Advertising by CINTEXA",
    description:
      "Ads Boost plans paid advertising campaigns with measurable goals and reports how ad activity connects to enquiries and revenue. Demo funnel uses sample data.",
    h1: "Ads Boost — Digital Advertising Platform for Campaigns",
    kind: "WebPage",
    crumbs: solutionCrumbs(svc("ads-boost")),
    faqs: SOLUTION_CONTENT["ads-boost"].faqs,
    service: svc("ads-boost"),
    intent: "commercial",
  },
  {
    path: svc("ecommerce").path,
    title: "E-commerce Development & Online Stores | CINTEXA",
    socialTitle: "E-commerce Development — CINTEXA",
    description:
      "CINTEXA builds online stores with product catalogues, checkout, order tracking and reporting so businesses in Ghana and beyond can sell online.",
    h1: "Ecommerce Platform & Digital Store Technology",
    kind: "WebPage",
    crumbs: solutionCrumbs(svc("ecommerce")),
    faqs: SOLUTION_CONTENT.ecommerce.faqs,
    service: svc("ecommerce"),
    intent: "commercial",
  },
  {
    path: "/blog",
    title: "CINTEXA Blog | Practical Technology Advice for Businesses",
    socialTitle: "CINTEXA Blog — Practical Technology Advice",
    description:
      "Original guides on software, websites, automation, SEO, e-commerce, CRM, cybersecurity and analytics for small businesses in Ghana and across Africa.",
    h1: "Practical Technology Advice for Growing Businesses",
    kind: "CollectionPage",
    crumbs: [{ name: "Blog", path: "/blog" }],
    intent: "informational",
  },
  {
    path: "/contact",
    title: "Contact CINTEXA | Email, Phone & WhatsApp",
    socialTitle: "Contact CINTEXA",
    description:
      "Contact CINTEXA about websites, custom software, automation or e-commerce. Email info@cintexa.com, call +233 24 248 3082 or message on WhatsApp.",
    h1: "Contact CINTEXA",
    kind: "ContactPage",
    crumbs: [{ name: "Contact", path: "/contact" }],
    intent: "transactional",
  },
  {
    path: "/get-started",
    title: "Get Started with CINTEXA | Create Your Account",
    socialTitle: "Get Started with CINTEXA",
    description:
      "Create your CINTEXA account to follow your enquiry, applications and updates in one dashboard, or contact the team to discuss your project.",
    h1: "Get started with CINTEXA",
    kind: "WebPage",
    crumbs: [{ name: "Get started", path: "/get-started" }],
    intent: "transactional",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | CINTEXA",
    socialTitle: "CINTEXA Privacy Policy",
    description:
      "How CINTEXA collects, uses, stores and shares personal information, including accounts, cookies, analytics, advertising, job applications and your rights.",
    h1: "Privacy Policy",
    kind: "WebPage",
    crumbs: [{ name: "Privacy Policy", path: "/privacy-policy" }],
    intent: "navigational",
  },
  {
    path: "/terms",
    title: "Terms & Conditions | CINTEXA",
    socialTitle: "CINTEXA Terms & Conditions",
    description:
      "Terms for using cintexa.com: accounts, services and proposals, payments, intellectual property, third-party tools, disclaimers and termination.",
    h1: "Terms & Conditions",
    kind: "WebPage",
    crumbs: [{ name: "Terms & Conditions", path: "/terms" }],
    intent: "navigational",
  },
  {
    path: "/cookie-policy",
    title: "Cookie Policy | CINTEXA",
    socialTitle: "CINTEXA Cookie Policy",
    description:
      "Which cookies and similar technologies CINTEXA uses (essential, analytics, advertising), how consent works and how to change your choices.",
    h1: "Cookie Policy",
    kind: "WebPage",
    crumbs: [{ name: "Cookie Policy", path: "/cookie-policy" }],
    intent: "navigational",
  },
  {
    path: "/disclaimer",
    title: "Disclaimer | CINTEXA",
    socialTitle: "CINTEXA Disclaimer",
    description:
      "CINTEXA's disclaimer for business, financial and technology information, examples and case studies, third-party links and affiliate disclosures.",
    h1: "Disclaimer",
    kind: "WebPage",
    crumbs: [{ name: "Disclaimer", path: "/disclaimer" }],
    intent: "navigational",
  },
];

const byPath = new Map(STATIC_PAGES.map((p) => [p.path, p]));
export const getStaticPage = (path: string): StaticPage | undefined => byPath.get(path.replace(/\/+$/, "") || "/");

export function breadcrumbTrail(page: Pick<StaticPage, "crumbs">): Crumb[] {
  return [{ name: "Home", path: "/" }, ...page.crumbs];
}

/** Builds the JSON-LD @graph for a static page. */
export function staticPageJsonLd(page: StaticPage, extraNodes: (JsonLdNode | null)[] = []): Record<string, unknown> {
  const url = abs(page.path);
  const isHome = page.path === "/";
  const items =
    page.path === "/platform"
      ? itemListNode(url, "CINTEXA solutions", SERVICES.map((s) => ({ name: s.name, path: s.path })))
      : null;
  return graph(
    organizationNode(),
    websiteNode(),
    webPageNode({
      url,
      name: page.title,
      description: page.description,
      type: page.kind,
      image: ENTITY.defaultImage,
      imageWidth: ENTITY.defaultImageWidth,
      imageHeight: ENTITY.defaultImageHeight,
      dateModified: page.updated,
      about: page.service ? `${url}#service` : undefined,
      isHome,
      hasBreadcrumb: !isHome,
      hasFaq: Boolean(page.faqs?.length),
    }),
    isHome ? null : breadcrumbNode(url, breadcrumbTrail(page)),
    page.service ? serviceNode(page.service) : null,
    page.faqs ? faqNode(url, page.faqs) : null,
    items,
    ...extraNodes,
  );
}

export function staticPageSeo(path: string, extraNodes: (JsonLdNode | null)[] = []): PageSeoData | undefined {
  const page = getStaticPage(path);
  if (!page) return undefined;
  return {
    title: page.title,
    socialTitle: page.socialTitle,
    description: page.description,
    canonical: abs(page.path),
    image: ENTITY.defaultImage,
    imageAlt: ENTITY.defaultImageAlt,
    imageWidth: ENTITY.defaultImageWidth,
    imageHeight: ENTITY.defaultImageHeight,
    imageType: "image/png",
    ogType: "website",
    twitterCard: "summary_large_image",
    robots: ROBOTS_INDEX,
    jsonLd: staticPageJsonLd(page, extraNodes),
  };
}

/** Pages that must never be indexed (private app surfaces). Canonical points at the site root. */
export function privateAreaSeo(title = "CINTEXA"): PageSeoData {
  return {
    title,
    socialTitle: "CINTEXA",
    description: "CINTEXA account area.",
    canonical: `${SITE_URL}/`,
    image: ENTITY.defaultImage,
    imageAlt: ENTITY.defaultImageAlt,
    ogType: "website",
    twitterCard: "summary_large_image",
    robots: "noindex, nofollow",
    jsonLd: null,
  };
}

/** 404 page: tells crawlers (and the client router) this URL is not a real page. */
export function notFoundSeo(): PageSeoData {
  return {
    title: "Page not found | CINTEXA",
    socialTitle: "Page not found",
    description: "This page does not exist or has moved. Browse CINTEXA's solutions, articles or contact the team.",
    canonical: `${SITE_URL}/`,
    image: ENTITY.defaultImage,
    imageAlt: ENTITY.defaultImageAlt,
    imageWidth: ENTITY.defaultImageWidth,
    imageHeight: ENTITY.defaultImageHeight,
    imageType: "image/png",
    ogType: "website",
    twitterCard: "summary_large_image",
    robots: ROBOTS_NOINDEX,
    jsonLd: null,
  };
}

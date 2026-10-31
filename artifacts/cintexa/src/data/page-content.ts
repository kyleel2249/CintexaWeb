/**
 * Answer-first content for the pages that previously had only a headline and a widget:
 * the five solution pages, the new /platform solutions hub and the home page.
 *
 * Each block has a question, a direct 40–60 word answer (what answer engines and visitors read first),
 * the audience, the problems solved and genuine FAQs. The React components render these AND the build-time
 * prerender/JSON-LD read the same arrays, so visible text and structured data cannot disagree.
 *
 * EDITORIAL RULES (enforced by tests in __tests__/page-content.test.ts):
 *  - No invented statistics, prices, client names, awards or guaranteed outcomes.
 *  - Say "can"/"depends on" for results; describe the approach, not a promised result.
 *  - Demos on the site use sample data — say so wherever they are mentioned.
 *
 * ⚠ OWNER REVIEW: the copy below was written from what the site already says about each service. Please read
 * the Ads Boost, Sales and Marketing blocks in particular and correct anything that does not match how CINTEXA
 * really delivers the service (see docs/SEO_AEO_GEO.md → "Content needing owner confirmation").
 */
import type { Faq } from "./seo-schema";
import type { ServiceId } from "./site-entity";

export type ArticleRef = { slug: string; title: string };
export type RelatedLink = { label: string; href: string; copy: string };

export type SolutionContent = {
  id: ServiceId | "platform";
  question: string;
  answer: string;
  audience: string[];
  problems: string[];
  faqs: Faq[];
  related: RelatedLink[];
  /** Related articles. `slug` and `title` must match blog-posts.ts exactly (a test enforces it). */
  articles: ArticleRef[];
  ctaLabel: string;
};

const WEB: RelatedLink = {
  label: "Web design & development",
  href: "/solutions/website-development",
  copy: "Business websites, online stores and web applications.",
};
const SOFTWARE: RelatedLink = {
  label: "Custom software development",
  href: "/solutions/software-development",
  copy: "Internal tools, customer applications, APIs and integrations.",
};
const ECOM: RelatedLink = {
  label: "E-commerce",
  href: "/solutions/ecommerce",
  copy: "Product catalogues, checkout and order workflows.",
};
const MARKETING: RelatedLink = {
  label: "Marketing technology",
  href: "/solutions/marketing",
  copy: "Campaigns, content, email and search with measurement.",
};
const SALES: RelatedLink = {
  label: "Sales technology",
  href: "/solutions/sales",
  copy: "Lead capture, pipeline tracking and follow-up.",
};
const ADS: RelatedLink = {
  label: "Ads Boost",
  href: "/solutions/ads-boost",
  copy: "Paid advertising planning and reporting.",
};
const HUB: RelatedLink = {
  label: "All solutions & business automation",
  href: "/platform",
  copy: "How CINTEXA's services fit together, including automation.",
};

export const SOLUTION_CONTENT: Record<SolutionContent["id"], SolutionContent> = {
  "software-development": {
    id: "software-development",
    question: "What is custom software development?",
    answer:
      "Custom software development means designing and building an application around a specific organisation's processes instead of bending the business to fit a generic product. CINTEXA builds internal tools, customer-facing applications, APIs and integrations, and agrees scope, milestones and handover with the client in writing.",
    audience: [
      "Teams running important work in spreadsheets, paper records or disconnected tools",
      "Businesses that need a system for inventory, orders, bookings, approvals or reporting",
      "Organisations that want existing platforms, payment providers or analytics connected",
    ],
    problems: [
      "Repeated data entry between systems",
      "No single, trustworthy record of customers, orders or tasks",
      "Off-the-shelf tools that do not fit a local workflow",
      "Reports that take hours of manual effort to assemble",
    ],
    faqs: [
      {
        q: "When does a business need custom software instead of an off-the-shelf tool?",
        a: "When the process is central to how the business earns or operates and existing products would force awkward workarounds. A useful first step is to list what your current tools cannot do. If a standard product covers most of your needs, it is often the more economical choice, and we will say so.",
      },
      {
        q: "How does a custom software project with CINTEXA work?",
        a: "It starts with a discovery conversation about your process, users and constraints. We then agree requirements, success measures, milestones and responsibilities in writing, build and test in stages, and hand over documentation so your team stays in control.",
      },
      {
        q: "How much does custom software cost?",
        a: "Cost depends on scope: the number of users and workflows, integrations, data migration and support needs. We give a written estimate after discovery rather than quoting a fixed price before the work is understood.",
      },
      {
        q: "Who owns custom software built by CINTEXA?",
        a: "Ownership and licensing for commissioned work are stated in the project agreement, including how third-party and open-source components are treated. Agree this in writing before work starts.",
      },
      {
        q: "Can new software connect to the tools we already use?",
        a: "Often yes, where those tools offer a documented API, webhooks or data export. We check what is available during discovery and explain any limits before you commit.",
      },
    ],
    related: [WEB, ECOM, HUB],
    articles: [
      { slug: "website-and-software-development-that-drives-growth", title: "Website and Software Development: What Businesses Should Plan Before Building" },
      { slug: "connected-technology-systems-for-business-growth", title: "How Connected Technology Systems Support Business Growth" },
      { slug: "business-automation-for-small-businesses", title: "Business Automation for Small Businesses: Where to Start" },
    ],
    ctaLabel: "Talk about your software project",
  },

  "website-development": {
    id: "website-development",
    question: "Why does a business need a professional website?",
    answer:
      "A professional website is where customers verify that a business exists, understand what it offers and contact it. It supports search visibility, works on mobile phones and can capture enquiries around the clock. CINTEXA designs and builds responsive, accessible business websites, online stores and web applications.",
    audience: [],
    problems: [],
    faqs: [],
    related: [SOFTWARE, ECOM, MARKETING],
    articles: [
      { slug: "technical-seo-checklist-for-business-websites", title: "Technical SEO Checklist for a Business Website" },
      { slug: "website-and-software-development-that-drives-growth", title: "Website and Software Development: What Businesses Should Plan Before Building" },
    ],
    ctaLabel: "Request a website consultation",
  },

  marketing: {
    id: "marketing",
    question: "What is marketing technology?",
    answer:
      "Marketing technology is the set of tools and routines used to plan campaigns, publish content, communicate with customers and measure what produces enquiries. CINTEXA helps businesses organise email, social, search and content around one plan with goals they can measure.",
    audience: [
      "Small businesses and founders who market across several channels with no shared plan",
      "Teams with a website but no clear view of where enquiries come from",
      "Organisations that want consent-aware ways to keep in touch with customers",
    ],
    problems: [
      "Channels managed in isolation, so effort is duplicated or dropped",
      "No clear link between activity and enquiries",
      "Content produced without a calendar or owner",
      "Contact lists kept without a record of consent",
    ],
    faqs: [
      {
        q: "What does CINTEXA's marketing technology cover?",
        a: "Four areas shown on this page: email (sequences and segmentation), social (scheduling and a content calendar), search (keyword and landing-page tracking) and content (an idea pipeline and publishing). We agree which of these fit your goals during discovery.",
      },
      {
        q: "How can digital marketing help a business get more customers?",
        a: "It puts your business in front of people who are searching or browsing and gives them a clear next step, such as an enquiry form or a WhatsApp message. Results depend on your offer, audience, competition and budget, so we agree what to measure before launching and do not promise specific outcomes.",
      },
      {
        q: "How can SEO improve a business's visibility?",
        a: "Search engine optimisation makes a website easier for search engines to crawl and understand, and gives visitors content that answers their questions. It builds gradually and rankings cannot be guaranteed. Our technical SEO checklist for business websites lists the first things to check.",
      },
      {
        q: "Which marketing metrics should a small business track?",
        a: "Start with a few: visits by source, enquiries, enquiries that become customers and, for paid activity, cost per enquiry. Give each a written definition and an owner. Our guide to marketing metrics explains how to choose them.",
      },
      {
        q: "Can I email customers without their permission?",
        a: "Where the law or platform rules require it, contacts should have agreed to receive marketing and be able to unsubscribe, and you should keep a record of that consent. This is general information, not legal advice; check the rules that apply to you.",
      },
    ],
    related: [WEB, SALES, ADS],
    articles: [
      { slug: "digital-marketing-metrics-small-businesses-should-track", title: "Digital Marketing Metrics Small Businesses Should Track" },
      { slug: "technical-seo-checklist-for-business-websites", title: "Technical SEO Checklist for a Business Website" },
      { slug: "sales-marketing-technology-platform-guide", title: "Choosing Sales and Marketing Technology for a Growing Team" },
    ],
    ctaLabel: "Plan your marketing with us",
  },

  sales: {
    id: "sales",
    question: "What is sales technology?",
    answer:
      "Sales technology helps a business capture leads, record every conversation and see where each prospect is in the buying process. CINTEXA sets up lead capture, a pipeline from first visit to repeat customer and follow-up reminders, so every enquiry has an owner and a next step.",
    audience: [
      "Businesses that receive enquiries by phone, WhatsApp, email and web forms and lose track of them",
      "Teams whose customer history lives in several people's phones and spreadsheets",
      "Owners who want to see which enquiries are waiting for a reply",
    ],
    problems: [
      "Enquiries missed or answered late",
      "No agreed stages from first contact to customer",
      "Duplicate or out-of-date customer records",
      "No visibility of what happens after a quote is sent",
    ],
    faqs: [
      {
        q: "What is a CRM and does a small business need one?",
        a: "A CRM (customer relationship management system) keeps contacts, conversations and next steps in one place. A small business benefits when enquiries are being missed or customer history is scattered. A simple system that everyone uses beats a complex one nobody updates.",
      },
      {
        q: "How can I stop losing leads?",
        a: "Make three things consistent: every enquiry is recorded in one place, each has a named owner, and each has a next action with a date. Our article on building a better lead follow-up process with a CRM walks through this.",
      },
      {
        q: "What does the Visitor to Loyal path on this page mean?",
        a: "It is the stage model shown on this page: visitor, lead, opportunity, customer and loyal customer. The page presents it as an illustrative flow; the stages used in a real project are agreed with you.",
      },
      {
        q: "Can lead capture connect to my website?",
        a: "Yes. Forms on a website can create records in the pipeline, with spam protection and clear consent wording. We confirm how this works with your existing site during discovery.",
      },
      {
        q: "How do we keep customer data accurate?",
        a: "Agree which fields are required, prevent duplicates at entry, review records on a schedule and give each field one owner. Our guide to CRM data quality covers practical routines.",
      },
    ],
    related: [MARKETING, WEB, SOFTWARE],
    articles: [
      { slug: "lead-generation-and-customer-accounts-one-core", title: "Building a Better Lead Follow-up Process With a CRM" },
      { slug: "crm-data-quality-and-customer-follow-up", title: "CRM Data Quality: Keep Customer Records Useful and Trustworthy" },
      { slug: "sales-marketing-technology-platform-guide", title: "Choosing Sales and Marketing Technology for a Growing Team" },
    ],
    ctaLabel: "Organise your sales follow-up",
  },

  "ads-boost": {
    id: "ads-boost",
    question: "What is Ads Boost?",
    answer:
      "Ads Boost is CINTEXA's paid-advertising service: planning campaigns, setting measurable goals and reporting how advertising activity connects to enquiries and revenue. The funnel on this page is an illustration built with sample data, not a record of real campaign results.",
    audience: [
      "Businesses that want to advertise online but cannot tell what their spend produces",
      "Teams with an offer and a website that are ready to test paid reach",
      "Owners who want advertising reported in terms of enquiries and revenue",
    ],
    problems: [
      "Ad spend that cannot be tied to enquiries or sales",
      "Campaigns launched without a landing page or tracking",
      "Reports full of clicks but no business outcome",
    ],
    faqs: [
      {
        q: "How does paid digital advertising work?",
        a: "Advertisers pay platforms to show messages to chosen audiences and are usually charged per click, view or conversion, depending on the platform. Results depend on the offer, audience, creative, landing page and budget.",
      },
      {
        q: "Will advertising guarantee sales?",
        a: "No. Advertising can increase visibility and enquiries but cannot guarantee sales. We set goals, track clicks, enquiries and conversions, and adjust based on evidence.",
      },
      {
        q: "What should be in place before running ads?",
        a: "A clear offer, a landing page or contact route that works well on a phone, and a way to record where each enquiry came from. Without these, spend is hard to evaluate.",
      },
      {
        q: "How is return on ad spend measured?",
        a: "By comparing the revenue attributed to a campaign with what it cost, using agreed tracking. Attribution is never perfect, so we state the assumptions behind any figure.",
      },
      {
        q: "What does the funnel on this page show?",
        a: "An animated illustration of the stages from impression to revenue. The numbers are sample data and do not come from real campaigns.",
      },
    ],
    related: [MARKETING, SALES, WEB],
    articles: [
      { slug: "digital-marketing-metrics-small-businesses-should-track", title: "Digital Marketing Metrics Small Businesses Should Track" },
      { slug: "sales-marketing-technology-platform-guide", title: "Choosing Sales and Marketing Technology for a Growing Team" },
    ],
    ctaLabel: "Plan an advertising campaign",
  },

  ecommerce: {
    id: "ecommerce",
    question: "What does it take to sell online?",
    answer:
      "Selling online needs a product catalogue, a checkout customers trust, a way to take payment and deliver orders, and reporting on what sells. CINTEXA builds online stores around those workflows. The 3D storefront on this page uses sample products only; it is a preview, not a live shop.",
    audience: [
      "Retailers and makers who want to sell beyond walk-in and chat orders",
      "Service businesses that want to take bookings or deposits online",
      "Businesses whose orders arrive by message and are hard to track",
    ],
    problems: [
      "Orders scattered across chats and notebooks",
      "Customers unsure of price, availability or delivery terms",
      "No record of which products sell",
      "Manual payment confirmation",
    ],
    faqs: [
      {
        q: "How can a small business start selling online in Ghana?",
        a: "Start with a short product list, clear photos and prices, delivery terms and the payment methods your customers already use, such as mobile money or cards through a supported payment provider. Our guide to planning an e-commerce website for a small business covers the steps.",
      },
      {
        q: "Do I need a website to sell online?",
        a: "An online store is a website first, so it needs the same foundations: clear pages, fast loading on mobile and trustworthy contact details. See our web design and development service for how business sites and stores are built.",
      },
      {
        q: "What features should an online store have?",
        a: "A searchable product catalogue, a simple cart and checkout, order confirmation and status updates, delivery information and reporting on orders. Extra features such as stock tracking or discounts depend on how you trade.",
      },
      {
        q: "Who pays payment-provider fees?",
        a: "Payment providers charge their own fees under their own terms. These are separate from the build cost and are explained before launch so you can include them in your pricing.",
      },
      {
        q: "Is the storefront on this page a real shop?",
        a: "No. It is an interactive preview with sample products to show how a store can look. A real store is connected to your own catalogue when it is built.",
      },
    ],
    related: [WEB, SOFTWARE, MARKETING],
    articles: [
      { slug: "ecommerce-and-digital-commerce-for-smes", title: "Planning an E-commerce Website for a Small Business in Ghana" },
      { slug: "website-and-software-development-that-drives-growth", title: "Website and Software Development: What Businesses Should Plan Before Building" },
    ],
    ctaLabel: "Plan your online store",
  },

  platform: {
    id: "platform",
    question: "What services does CINTEXA provide?",
    answer:
      "CINTEXA provides custom software development, web design and development, e-commerce, marketing and sales technology, paid-advertising support and business automation. Every project starts with understanding the business problem, then agreeing scope, milestones and success measures in writing.",
    audience: [
      "Small and medium-sized businesses, founders and service providers",
      "Retailers and organisations that need a stronger online presence",
      "Teams that want repetitive work and scattered records brought under control",
    ],
    problems: [
      "Outdated websites and disconnected digital customer experiences",
      "Manual processes with repeated data entry and missed follow-ups",
      "Scattered customer, sales and marketing information",
      "Little visibility of digital performance",
    ],
    faqs: [
      {
        q: "What problems does CINTEXA solve?",
        a: "Outdated websites, repeated manual data entry, missed follow-ups, scattered customer information, online selling that is hard to manage and limited visibility into what marketing and operations are producing.",
      },
      {
        q: "How does business automation work?",
        a: "Business automation uses software to carry out repetitive, rule-based steps, such as acknowledging an enquiry, assigning follow-up, sending reminders or copying data between systems, so people spend their time on decisions and customers. It starts by mapping the current process and agreeing what should and should not be automated.",
      },
      {
        q: "Which tasks should a business automate first?",
        a: "Choose one frequent, rule-based hand-off that causes delay or errors, for example confirming a new enquiry and assigning it to someone. Automate that, check it works as intended, then extend. Our guide to business automation for small businesses explains how to pick a starting point.",
      },
      {
        q: "How can software improve business operations?",
        a: "By keeping one reliable record of customers, orders and tasks, removing repeated data entry, making status visible to the people who need it and producing reports without manual compiling. The benefit depends on fitting the software to the real process.",
      },
      {
        q: "How can businesses use analytics to make better decisions?",
        a: "Begin with a decision to be made, define the measure and its source, check data quality and review results on a routine, recording the action taken and who owns it. Our article on using business data covers this in practice.",
      },
      {
        q: "Where can I get business automation solutions in Ghana?",
        a: "CINTEXA designs automation for businesses in Ghana and beyond. Describe the process you want to improve through the contact page and we will advise whether automation, an off-the-shelf tool or a change to the process is the better fit.",
      },
    ],
    related: [SOFTWARE, WEB, ECOM, MARKETING, SALES, ADS],
    articles: [
      { slug: "business-automation-for-small-businesses", title: "Business Automation for Small Businesses: Where to Start" },
      { slug: "connected-technology-systems-for-business-growth", title: "How Connected Technology Systems Support Business Growth" },
      { slug: "using-business-data-to-make-better-decisions", title: "How Small Businesses Can Use Data to Make Better Decisions" },
    ],
    ctaLabel: "Describe your business problem",
  },
};

export const SOLUTION_IDS = Object.keys(SOLUTION_CONTENT) as SolutionContent["id"][];

/** Home page: direct answer + FAQs (also used for prerender, llms.txt and FAQPage JSON-LD). */
export const HOME_ANSWER = {
  question: "What is CINTEXA?",
  answer:
    "CINTEXA is a technology and digital business solutions company. It builds custom software, websites, e-commerce experiences and business automation systems, and helps businesses in Ghana and beyond assess where they are, improve operations, reach customers and measure growth.",
};

export const HOME_FAQS: Faq[] = [
  {
    q: "Who does CINTEXA help?",
    a: "Small and medium-sized businesses, founders, service providers, retailers and teams that need a stronger digital presence or better-organised operations. Scope and delivery are agreed around each client's goals, budget and available information.",
  },
  {
    q: "What services does CINTEXA provide?",
    a: "Custom software development, web design and development, e-commerce, marketing technology, sales technology, advertising support and business automation. See the solutions overview for how they fit together.",
  },
  {
    q: "What makes CINTEXA different?",
    a: "We begin with assessment before technology, agree scope and success measures in writing and avoid promising results we cannot evidence. Case studies on this site are labelled illustrative until a client has approved a verified one.",
  },
  {
    q: "How do I get started with CINTEXA?",
    a: "Use the Get started page to create an account, or contact the team by email, phone or WhatsApp. After a short discovery conversation we send a written scope and estimate.",
  },
  {
    q: "Where is CINTEXA based?",
    a: "CINTEXA operates digitally and serves clients online in Ghana and beyond. A public office address has not been published; use the contact page to reach the team.",
  },
];

export const HOME_RELATED: RelatedLink[] = [WEB, SOFTWARE, ECOM, HUB];

/** How a business automation project runs. Shown on /platform and in its prerendered HTML. */
export const PLATFORM_AUTOMATION_STEPS = [
  { title: "Map the current process", copy: "Write down each step from the first enquiry to the finished job: who does what, in which tool, and where work waits." },
  { title: "Pick one hand-off to automate", copy: "Choose a frequent, rule-based step that causes delay or errors, such as acknowledging an enquiry and assigning it to a person." },
  { title: "Build it and test it with real cases", copy: "Configure the workflow, run normal and unusual cases, and decide what a person must still approve." },
  { title: "Measure, review and extend", copy: "Compare against the starting point, fix what the data shows, then move to the next hand-off." },
] as const;

export const PLATFORM_HOW_WE_WORK = [
  { title: "Discovery", copy: "We listen to the problem, the people involved and the tools you already use." },
  { title: "Scope and estimate", copy: "Requirements, success measures, milestones and responsibilities are agreed in writing." },
  { title: "Build and test", copy: "Work is delivered in stages and tested with realistic cases before launch." },
  { title: "Handover and improvement", copy: "Documentation, training and a review of results so your team stays in control." },
] as const;

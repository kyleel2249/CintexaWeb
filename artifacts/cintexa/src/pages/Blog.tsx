import { useEffect } from "react";
import { Link, useRoute } from "wouter";

type Section = { heading: string; paragraphs: string[]; bullets?: string[] };
type Post = {
  slug: string; title: string; excerpt: string; date: string; updated?: string;
  category: string; readTime: string; keyword: string; image: string; imageAlt: string;
  intro: string; sections: Section[]; references: { label: string; url: string }[];
};
export const POSTS: Post[] = [
  {
    slug: "connected-technology-systems-for-business-growth",
    title: "How Connected Technology Systems Support Business Growth",
    excerpt: "A practical look at connecting lead capture, customer records, sales activity and reporting so teams can work with consistent information.",
    date: "2026-10-01", updated: "2026-10-08", category: "Business technology", readTime: "7 min",
    keyword: "connected business technology systems",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Business analytics dashboard on a computer screen",
    intro: "When customer information sits in separate spreadsheets, inboxes and applications, teams spend time reconciling records instead of serving customers. Connected business technology links the steps that matter—from the first enquiry to delivery and follow-up—while keeping people responsible for decisions.",
    sections: [
      { heading: "Start with the business process", paragraphs: ["List the steps from first contact to completed sale and repeat purchase. Note who owns each step, which information they need, and where delays or duplicate entry happen. This process map is a better starting point than buying software because it reveals the actual work the system must support.", "For a small business, a first improvement might be a single enquiry form that creates a consistent lead record, assigns a follow-up owner and records the next action. The initial system can be modest; consistency matters more than feature count."] },
      { heading: "Connect records, not every tool", paragraphs: ["A useful system gives teams a reliable customer record and clear rules for how information moves. Website forms, customer relationship management (CRM), email and order management can exchange selected data through supported integrations or APIs. Avoid copying every field everywhere: decide which system owns each record and how errors are resolved."] },
      { heading: "Measure the outcome", paragraphs: ["Choose a baseline before changing the process. Useful measures include time to respond to an enquiry, lead-to-sale conversion, order errors, repeat purchases and hours spent on manual reporting. Compare like-for-like periods and document other changes that may affect results. Do not claim an improvement until the data supports it.", "Review access permissions, backups, retention and staff training as part of the rollout. A connected system can spread incorrect information quickly if data quality and ownership are neglected."] },
      { heading: "A practical implementation sequence", paragraphs: ["Choose one high-friction process, map it, clean the data, configure a small workflow, test it with real users, and review results before expanding. Keep a manual fallback for critical tasks during the transition."] , bullets: ["Document the current workflow and its pain points.", "Set a measurable baseline and one primary goal.", "Pilot with a small group and gather feedback.", "Review security, permissions and recovery procedures.", "Expand only after the workflow proves useful."] }
    ],
    references: [{ label: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework" }, { label: "Google Search Central: helpful, reliable, people-first content", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" }]
  },
  {
    slug: "sales-marketing-technology-platform-guide",
    title: "Choosing Sales and Marketing Technology for a Growing Team",
    excerpt: "A selection framework for lead capture, follow-up, campaign measurement and customer records without buying tools your team cannot maintain.",
    date: "2026-09-22", category: "Sales & marketing", readTime: "8 min", keyword: "sales and marketing technology",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Team discussing a business plan around a table",
    intro: "Sales and marketing software works best when both teams agree on what a qualified enquiry looks like, how quickly it should receive attention and what counts as a successful outcome. Buying separate tools before agreeing on these definitions often creates more reporting work.",
    sections: [
      { heading: "Define the hand-off", paragraphs: ["Map the customer path from campaign or referral to enquiry, qualification, proposal and sale. Decide which team owns each stage, what information must be captured, and when an enquiry is considered ready for sales follow-up. Record these rules in plain language so new staff can use them."] },
      { heading: "Select tools against requirements", paragraphs: ["Prioritise reliable forms, contact history, task reminders, campaign source tracking, consent records, reporting and export options. Check whether a product integrates with the systems you already use, supports the expected number of users, and provides adequate access controls. Request a realistic demonstration using your workflow rather than a generic sales presentation."] },
      { heading: "Keep measurement honest", paragraphs: ["Track response time, qualified lead rate, stage conversion, sales cycle length and campaign cost where reliable cost data exists. Distinguish attributed conversions from conversions that merely happened after a campaign. Attribution is a model, not proof that a single channel caused the sale."] },
      { heading: "Roll out in stages", paragraphs: ["Start with one customer segment or sales team. Clean duplicate contacts, train users on a shared process, and review data completeness weekly. Add automation only after the underlying process is stable; otherwise, automation can make mistakes faster."] , bullets: ["Agree on lifecycle stages and definitions.", "Choose a small set of business-critical fields.", "Test integrations and exports before migration.", "Train staff and assign data ownership.", "Review adoption and results before adding features."] }
    ],
    references: [{ label: "Google Analytics documentation", url: "https://support.google.com/analytics/" }, { label: "NIST Privacy Framework", url: "https://www.nist.gov/privacy-framework" }]
  },
  {
    slug: "ecommerce-and-digital-commerce-for-smes",
    title: "Planning an E-commerce Website for a Small Business in Ghana",
    excerpt: "The practical building blocks of online selling: product data, payments, delivery, customer support, security and order operations.",
    date: "2026-09-10", category: "E-commerce", readTime: "8 min", keyword: "e-commerce website for small business Ghana",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Customer completing a purchase at a checkout counter",
    intro: "An e-commerce website is an operating process as well as a storefront. Before investing in design, a business should decide how products are maintained, how customers pay, how orders are fulfilled and who resolves delivery or refund issues.",
    sections: [
      { heading: "Prepare reliable product information", paragraphs: ["Each product needs a clear name, useful description, accurate price, current availability, good photographs and any relevant size, colour or specification options. Agree on who updates inventory and how quickly online stock reflects sales made elsewhere. Incorrect product data creates avoidable support work and erodes customer trust."] },
      { heading: "Plan payments and delivery early", paragraphs: ["Choose payment methods suitable for your customers and confirm settlement timing, transaction charges, refund handling and reconciliation. For Ghanaian businesses, test the complete customer path with the payment providers you intend to use, including mobile-friendly checkout and failed-payment recovery. Set delivery zones, fees, dispatch expectations and a process for communicating delays."] },
      { heading: "Build trust into the buying experience", paragraphs: ["Display clear contact details, delivery and return terms, privacy information and secure checkout indicators. Collect only information needed to fulfil an order. Make checkout forms accessible on mobile devices and avoid requiring account creation unless it serves a clear customer need."] },
      { heading: "Measure operations after launch", paragraphs: ["Monitor product views, cart abandonment, successful payment rate, fulfilment time, cancellations and repeat purchases. Use the measures to find friction, not to assume that every change caused an outcome. Start with a manageable product range and improve the process before adding complexity."] }
    ],
    references: [{ label: "PCI Security Standards Council", url: "https://www.pcisecuritystandards.org/" }, { label: "Ghana Revenue Authority", url: "https://gra.gov.gh/" }]
  },
  {
    slug: "website-and-software-development-that-drives-growth",
    title: "Website and Software Development: What Businesses Should Plan Before Building",
    excerpt: "Turn a business need into a maintainable website or application with clear scope, user journeys, security, testing and ownership.",
    date: "2026-08-28", category: "Software development", readTime: "7 min", keyword: "website and software development for businesses",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Developer workstation with code on a monitor",
    intro: "A successful digital project begins with a clearly defined problem. A website may need to explain services and generate enquiries; an internal application may need to reduce duplicate entry or make approvals visible. The purpose determines the features, architecture and measures of success.",
    sections: [
      { heading: "Write requirements users can verify", paragraphs: ["Describe who will use the system, what they need to do, which information is required and what should happen when something fails. Turn broad requests into testable acceptance criteria. For example, specify what a contact form must validate, where a successful submission is stored and what confirmation the visitor receives."] },
      { heading: "Design for maintainability", paragraphs: ["Choose technologies that match the project’s needs and the team’s ability to support them. Plan hosting, backups, monitoring, content updates, ownership of domains and accounts, and a way to recover from failed releases. Keep secrets out of frontend code and give each service only the permissions it needs."] },
      { heading: "Test beyond the happy path", paragraphs: ["Test mobile layouts, keyboard navigation, slow connections, invalid inputs, permission boundaries, missing configuration and failed network requests. Automated tests are useful, but a human review of the real user journey remains necessary."] },
      { heading: "Measure business value", paragraphs: ["Set a baseline and review outcomes after launch: enquiry quality, task completion time, support requests, conversion rates or operational errors. Include training and maintenance in the project plan. A site that launches quickly but cannot be updated safely is not a finished business solution."] }
    ],
    references: [{ label: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" }, { label: "W3C Web Accessibility Initiative", url: "https://www.w3.org/WAI/standards-guidelines/wcag/" }]
  },
  {
    slug: "lead-generation-and-customer-accounts-one-core",
    title: "Building a Better Lead Follow-up Process With a CRM",
    excerpt: "A straightforward way to capture enquiries, assign ownership, follow up consistently and keep customer information useful.",
    date: "2026-08-15", category: "CRM & productivity", readTime: "6 min", keyword: "CRM lead follow-up process",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Colleagues reviewing customer and sales information",
    intro: "Leads are easily lost when enquiries arrive through different channels and no one owns the next action. A simple customer relationship management (CRM) process makes responsibilities visible and preserves context between the first conversation and later service.",
    sections: [
      { heading: "Capture only useful information", paragraphs: ["Collect the customer’s name, preferred contact method, request, source and the next step. Avoid gathering sensitive or unrelated information. Explain how contact details will be used and record marketing preferences separately from service-related communications."] },
      { heading: "Give every enquiry an owner", paragraphs: ["Use clear stages such as New, Contacted, Qualified, Proposal and Won/Lost. Each open record should have an owner, next action and due date. Agree on response expectations and define when a lead can be closed or reassigned."] },
      { heading: "Automate reminders, not judgement", paragraphs: ["Notifications and task reminders can reduce missed follow-ups. Avoid sending repeated messages without checking consent and context. Staff should review customer history before contacting someone and should be able to correct inaccurate records."] },
      { heading: "Review the process regularly", paragraphs: ["Review overdue tasks, duplicate contacts, stage conversion and reasons deals are lost. Use the findings to improve the process and training. Keep exports, access controls and retention rules in place so customer records remain secure and useful."] }
    ],
    references: [{ label: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework" }, { label: "Google Search Central", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" }]
  },
  {
    slug: "business-automation-for-small-businesses",
    title: "Business Automation for Small Businesses: Where to Start",
    excerpt: "Map repeatable work and automate predictable steps without losing human oversight.",
    date: "2026-10-08", category: "Business automation", readTime: "6 min", keyword: "business automation for small businesses",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Team collaborating with digital tools on a laptop",
    intro: "Business automation works best when it removes a clear source of repeated effort. It does not mean removing people from every decision. For many small businesses, a useful first step is to make an existing workflow consistent, then automate predictable parts.",
    sections: [
      { heading: "Find repeatable work", paragraphs: ["Look for tasks that happen often and follow a stable sequence: capturing enquiries, sending acknowledgements, assigning tasks, preparing routine reports or reminding a team member about a due date. Record the current steps, including exceptions and approvals.", "Do not automate a process that staff cannot explain. Clarify ownership and remove unnecessary steps before choosing software."] },
      { heading: "Design safeguards into the workflow", paragraphs: ["Specify what starts the workflow, what information is required, who receives the task and what happens if a step fails. Use validation to prevent incomplete records, logs to show what happened and an escalation path for exceptions. People should be able to correct mistakes and handle unusual cases.", "Protect customer and employee information with role-based access, retention rules and secure integrations. Test with sample records before connecting automation to live operations."] },
      { heading: "Measure whether it helped", paragraphs: ["Track time per task, error rates, overdue work and user adoption before and after rollout. Document the baseline and other changes that may affect results. A workflow is useful when it improves reliability or frees time for valuable work—not simply because it contains automation."] }
    ],
    references: [{ label: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework" }]
  },
  {
    slug: "technical-seo-checklist-for-business-websites",
    title: "Technical SEO Checklist for a Business Website",
    excerpt: "Review crawl access, metadata, canonical URLs, internal links, mobile usability and structured data.",
    date: "2026-10-07", category: "SEO", readTime: "7 min", keyword: "technical SEO checklist for business websites",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Website analytics and search performance on a display",
    intro: "Technical SEO helps search engines access and interpret useful pages. It cannot compensate for weak content, but broken routes, duplicate URLs or missing metadata can make a strong site harder to understand. Review technical health alongside content quality and user experience.",
    sections: [
      { heading: "Check indexing and crawl access", paragraphs: ["Confirm important pages return successful responses, are linked from relevant pages and are not accidentally marked noindex. Keep robots.txt focused on crawl guidance rather than using it to hide private information. Submit a valid XML sitemap in Google Search Console and review unexpected indexing exclusions."] },
      { heading: "Give each page a clear purpose", paragraphs: ["Write a descriptive title and concise meta description for each page. Use a clear H1, logical subheadings, descriptive link text and useful image alternative text. Add canonical URLs where duplicate or parameterised versions may exist. Avoid repeating keywords unnaturally or creating thin pages solely for search phrases."] },
      { heading: "Improve experience and validate markup", paragraphs: ["Test navigation and forms on mobile devices. Compress images, avoid unnecessary scripts, reserve image dimensions to reduce layout shifts and make key content keyboard-accessible. Add structured data only when it accurately describes visible content; valid markup does not guarantee rich results or higher rankings."] }
    ],
    references: [{ label: "Google Search Central SEO Starter Guide", url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide" }, { label: "Google Search Console", url: "https://search.google.com/search-console/about" }]
  },
  {
    slug: "cybersecurity-basics-for-small-businesses-in-ghana",
    title: "Cybersecurity Basics for Small Businesses in Ghana",
    excerpt: "Practical steps for account security, backups, staff awareness and incident response.",
    date: "2026-10-06", category: "Cybersecurity", readTime: "7 min", keyword: "cybersecurity for small businesses in Ghana",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Laptop displaying a digital security interface",
    intro: "Small organisations hold customer contacts, invoices, credentials and operational records that can be valuable to attackers. Security does not require a large security department to begin; consistent basic practices can reduce common risks. The right controls depend on the business and its systems.",
    sections: [
      { heading: "Protect important accounts", paragraphs: ["Use unique passwords stored in a reputable password manager and enable multi-factor authentication wherever available, especially for email, banking, hosting, domain registration and administrator accounts. Remove access promptly when a worker or supplier no longer needs it. Avoid sharing administrator credentials in group chats."] },
      { heading: "Maintain systems and backups", paragraphs: ["Install operating-system and application updates, remove unused software and restrict administrator privileges. Keep backups separate from everyday access where possible and test restoring a file or system; an untested backup may not be recoverable when needed.", "Check that website, domain and cloud accounts have current recovery details. Teach staff to verify unexpected payment changes, attachments and urgent requests through a known contact channel."] },
      { heading: "Prepare for incidents", paragraphs: ["Write down who to contact, how to disable compromised accounts, where backups are stored and how to preserve evidence. If customer data may be affected, seek qualified incident-response and legal guidance and follow applicable notification requirements. This is general guidance, not a substitute for a security assessment."] }
    ],
    references: [{ label: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework" }, { label: "Cyber Security Authority Ghana", url: "https://csa.gov.gh/" }]
  },
  {
    slug: "digital-marketing-metrics-small-businesses-should-track",
    title: "Digital Marketing Metrics Small Businesses Should Track",
    excerpt: "Connect marketing activity to qualified enquiries, sales outcomes and customer retention instead of relying on likes alone.",
    date: "2026-10-05", category: "Digital marketing", readTime: "6 min", keyword: "digital marketing metrics for small businesses",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Marketing analytics charts on a computer monitor",
    intro: "Views, followers and clicks can help explain attention, but they do not tell the whole story. A small business should choose a compact set of measures tied to its objective, then use consistent definitions to compare activity over time.",
    sections: [
      { heading: "Start with the business outcome", paragraphs: ["For a service business, the outcome may be qualified enquiries or booked consultations. For an online store, it may be completed orders, average order value or repeat purchases. Define what counts as a qualified lead or successful order before setting up reports."] },
      { heading: "Track the path to action", paragraphs: ["Useful measures include landing-page visits, enquiry completion rate, cost per qualified lead when spend is known, lead-to-sale conversion and time to first response. Use campaign tags consistently and check that analytics events are not duplicated. A conversion after an ad click does not prove that the ad alone caused the sale."] },
      { heading: "Turn reporting into a decision", paragraphs: ["Review missing campaign sources and mismatches between analytics and sales records. Configure analytics and advertising technologies in line with privacy requirements. Use each review to decide what to test, improve or stop, and record changes so the result can be interpreted honestly."] }
    ],
    references: [{ label: "Google Analytics Help", url: "https://support.google.com/analytics/" }, { label: "Google Ads Help", url: "https://support.google.com/google-ads/" }]
  },
  {
    slug: "crm-data-quality-and-customer-follow-up",
    title: "CRM Data Quality: Keep Customer Records Useful and Trustworthy",
    excerpt: "Rules for duplicate prevention, consistent fields, record ownership, consent and routine CRM maintenance.",
    date: "2026-10-04", category: "CRM", readTime: "6 min", keyword: "CRM data quality and customer records",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Team reviewing customer records and business workflow",
    intro: "A CRM is only useful when staff trust its records. Duplicate contacts, outdated details and unclear deal stages can lead to repeated messages, missed follow-ups and unreliable reports. Data quality is an ongoing process, not a one-time import task.",
    sections: [
      { heading: "Agree on shared fields", paragraphs: ["Define required fields, how phone numbers are formatted and what each sales stage means. Collect information that supports service and follow-up, not every possible detail. Make field instructions visible to staff and review them when the process changes."] },
      { heading: "Assign ownership and handle duplicates", paragraphs: ["Decide who owns a customer record and how records are merged. Use appropriate matching rules to flag likely duplicates, but review uncertain identities before merging. Give staff a clear process for correcting inaccurate data instead of creating another shadow spreadsheet."] },
      { heading: "Respect preferences and review quality", paragraphs: ["Record the source and purpose of customer information, keep marketing preferences separate from service communications and honour unsubscribe requests. Restrict sensitive notes and exports, define retention periods and review incomplete records, overdue tasks and stale opportunities on a regular schedule."] }
    ],
    references: [{ label: "NIST Privacy Framework", url: "https://www.nist.gov/privacy-framework" }]
  },
  {
    slug: "using-business-data-to-make-better-decisions",
    title: "How Small Businesses Can Use Data to Make Better Decisions",
    excerpt: "Turn sales, customer and operational records into clear questions, trustworthy measures and decisions the team can review.",
    date: "2026-10-02", category: "Data & analytics", readTime: "6 min", keyword: "business data analytics for small businesses",
    image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Data charts and a business performance report",
    intro: "Business analytics does not begin with a complex dashboard. It begins with a question: which products are often returned, where do enquiries stall, or which service tasks take longer than expected? Reliable answers depend on consistent records and measures people understand.",
    sections: [
      { heading: "Start with a decision", paragraphs: ["Choose a decision the business needs to make and identify the data that could inform it. Define the measure, period, source and owner. If the data cannot support the question, record that limitation rather than filling gaps with assumptions."] },
      { heading: "Check data quality", paragraphs: ["Look for missing values, duplicates, inconsistent date ranges and changes in how staff record activity. Compare totals with a trusted operational source where possible. Label estimated or incomplete values and document how metrics are calculated."] },
      { heading: "Make reporting repeatable", paragraphs: ["A weekly report may show sales, qualified enquiries, fulfilment time and overdue work. Use consistent definitions and include context for unusual events. Record the action agreed, its owner and the review date. Protect personal information in reports and give users access only to data they need."] }
    ],
    references: [{ label: "Google Analytics Help", url: "https://support.google.com/analytics/" }, { label: "NIST Privacy Framework", url: "https://www.nist.gov/privacy-framework" }]
  },
];

function useArticleSeo(post: Post | undefined) {
  useEffect(() => {
    if (!post) return;
    const canonical = `https://cintexa.com/blog/${post.slug}`;
    document.title = `${post.title} | CINTEXA`;
    const set = (selector: string, attr: string, value: string) => {
      let node = document.querySelector(selector) as HTMLMetaElement | null;
      if (!node) { node = document.createElement("meta"); node.setAttribute(attr, selector.includes('property=') ? selector.match(/property="([^"]+)"/)?.[1] || "" : selector.match(/name="([^"]+)"/)?.[1] || ""); document.head.appendChild(node); }
      node.content = value;
    };
    set('meta[name="description"]', "name", post.excerpt);
    set('meta[name="robots"]', "name", "index, follow");
    set('meta[property="og:title"]', "property", post.title);
    set('meta[property="og:description"]', "property", post.excerpt);
    set('meta[property="og:image"]', "property", post.image);
    set('meta[property="og:url"]', "property", canonical);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
  }, [post]);
}

export function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const post = POSTS.find((item) => item.slug === params?.slug);
  useArticleSeo(post);
  if (!post) return <div className="cx-section"><div className="cx-container"><h1 className="cx-display text-3xl">Article not found</h1><Link href="/blog" className="cx-btn cx-btn-primary mt-6">Back to blog</Link></div></div>;
  const related = POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);
  const structured = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, image: post.image, datePublished: post.date, dateModified: post.updated || post.date, author: { "@type": "Organization", name: "CINTEXA Editorial Team", url: "https://cintexa.com/about" }, publisher: { "@type": "Organization", name: "CINTEXA", url: "https://cintexa.com" }, mainEntityOfPage: `https://cintexa.com/blog/${post.slug}`, keywords: post.keyword };
  return <article className="cx-section"><div className="cx-container max-w-3xl">
    <nav aria-label="Breadcrumb" className="text-sm text-[hsl(var(--fg-muted))]"><Link href="/" className="underline">Home</Link> / <Link href="/blog" className="underline">Blog</Link> / <span>{post.category}</span></nav>
    <p className="cx-eyebrow mt-6">{post.category} · {post.readTime} read</p><h1 className="cx-display mt-3 text-3xl sm:text-5xl">{post.title}</h1>
    <p className="mt-5 text-lg text-[hsl(var(--fg-muted))]">{post.excerpt}</p>
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[hsl(var(--fg-muted))]"><span>Author: CINTEXA Editorial Team</span><time dateTime={post.date}>Published {post.date}</time>{post.updated && <time dateTime={post.updated}>Updated {post.updated}</time>}</div>
    <img src={post.image} alt={post.imageAlt} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" loading="eager" />
    <p className="mt-8 text-base leading-8">{post.intro}</p>
    <div className="mt-8 space-y-8">{post.sections.map((section) => <section key={section.heading}><h2 className="cx-display text-2xl">{section.heading}</h2>{section.paragraphs.map((p) => <p key={p} className="mt-3 leading-8 text-[hsl(var(--fg-muted))]">{p}</p>)}{section.bullets && <ul className="mt-4 list-disc space-y-2 pl-6 text-[hsl(var(--fg-muted))]">{section.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}</section>)}</div>
    <section className="mt-10 border-t border-[hsl(var(--border))] pt-6"><h2 className="cx-display text-xl">Sources and further reading</h2><ul className="mt-3 list-disc space-y-2 pl-6">{post.references.map((r) => <li key={r.url}><a className="underline text-[hsl(var(--accent))]" href={r.url} target="_blank" rel="noopener noreferrer">{r.label}</a></li>)}</ul><p className="mt-4 text-sm text-[hsl(var(--fg-muted))]">This article is general educational information, not legal, financial or cybersecurity advice for a specific situation.</p></section>
    <section className="mt-10"><h2 className="cx-display text-xl">Related articles</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{related.map((r) => <Link key={r.slug} href={`/blog/${r.slug}`} className="cx-card block"><span className="cx-eyebrow">{r.category}</span><span className="mt-2 block font-medium">{r.title}</span></Link>)}</div></section>
    <div className="cx-card mt-10"><h2 className="cx-display text-xl">Need a digital solution for your business?</h2><p className="mt-2 text-[hsl(var(--fg-muted))]">Tell CINTEXA what you are trying to improve and we can discuss a practical next step.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/get-started" className="cx-btn cx-btn-primary">Get started</Link><Link href="/contact" className="cx-btn cx-btn-secondary">Contact CINTEXA</Link></div></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
  </div></article>;
}

export function Blog() {
  return <div className="cx-section"><div className="cx-container max-w-5xl">
    <p className="cx-eyebrow">CINTEXA Blog</p><h1 className="cx-display mt-3 text-3xl sm:text-5xl">Practical Technology Advice for Growing Businesses</h1>
    <p className="mt-4 max-w-3xl text-[hsl(var(--fg-muted))]">Original, practical guidance on software development, business automation, website development, SEO, e-commerce, digital marketing, CRM, cybersecurity, productivity, analytics and technology for businesses in Ghana and across Africa.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-2">{[...POSTS].sort((a, b) => b.date.localeCompare(a.date)).map((post) => <article key={post.slug} className="cx-card cx-card-interactive overflow-hidden"><Link href={`/blog/${post.slug}`}><img src={post.image} alt={post.imageAlt} className="aspect-[16/9] w-full rounded-xl object-cover" loading="lazy" /><p className="cx-eyebrow mt-5">{post.category} · {post.readTime} read</p><h2 className="cx-display mt-2 text-xl">{post.title}</h2><p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{post.excerpt}</p><p className="mt-4 text-sm font-medium text-[hsl(var(--accent))]">Read article →</p></Link><meta itemProp="keywords" content={post.keyword} /></article>)}</div>
    <div className="cx-card mt-10"><h2 className="cx-display text-xl">Have a business technology question?</h2><p className="mt-2 text-[hsl(var(--fg-muted))]">Contact us to discuss a website, software project or business process improvement.</p><Link href="/get-started" className="cx-btn cx-btn-primary mt-4">Get started</Link></div>
  </div></div>;
}
export default Blog;

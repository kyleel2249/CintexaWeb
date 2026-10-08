import { Link } from "wouter";

/**
 * CINTEXA Blog — SEO-optimized articles on growth technology, sales, marketing & ecommerce.
 * Path: artifacts/cintexa/src/pages/Blog.tsx
 */

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  primaryKeyword: string;
};

const POSTS: Post[] = [
  {
    slug: "connected-technology-systems-for-business-growth",
    title: "Connected Technology Systems That Help Businesses Sell, Market & Grow",
    excerpt:
      "How a single connected core for lead generation, customer accounts, and automation turns first-time visitors into a loyal customer base.",
    date: "2026-10-01",
    category: "Platform",
    readTime: "6 min",
    primaryKeyword: "connected technology systems",
  },
  {
    slug: "sales-marketing-technology-platform-guide",
    title: "Sales & Marketing Technology Platform: A Practical Guide for Growing Teams",
    excerpt:
      "Why modern teams need one platform for lead generation, pipeline visibility, and marketing automation instead of fragmented tools.",
    date: "2026-09-22",
    category: "Sales & Marketing",
    readTime: "8 min",
    primaryKeyword: "sales marketing technology platform",
  },
  {
    slug: "ecommerce-and-digital-commerce-for-smes",
    title: "Ecommerce & Digital Commerce Platforms Built for SMEs in Emerging Markets",
    excerpt:
      "Inventory, payments, customer accounts and marketing in one stack — designed for teams that need reliable commerce without enterprise complexity.",
    date: "2026-09-10",
    category: "Ecommerce",
    readTime: "7 min",
    primaryKeyword: "digital commerce platform",
  },
  {
    slug: "website-and-software-development-that-drives-growth",
    title: "Website & Software Development That Drives Measurable Business Growth",
    excerpt:
      "Custom websites and software that integrate with sales, marketing and operations — not just static sites that sit offline.",
    date: "2026-08-28",
    category: "Development",
    readTime: "5 min",
    primaryKeyword: "website and software development",
  },
  {
    slug: "lead-generation-and-customer-accounts-one-core",
    title: "Lead Generation and Customer Accounts From One Connected Core",
    excerpt:
      "Stop losing context between marketing campaigns and the sales team. See how CINTEXA unifies lead capture, nurturing and account management.",
    date: "2026-08-15",
    category: "Growth",
    readTime: "6 min",
    primaryKeyword: "lead generation platform",
  },
];

export function Blog() {
  return (
    <div className="cx-section">
      <div className="cx-container max-w-4xl">
        <p className="cx-eyebrow">Blog</p>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">
          Insights on Growth Technology, Sales &amp; Digital Commerce
        </h1>
        <p className="mt-4 max-w-2xl text-[hsl(var(--fg-muted))]">
          Practical articles from the CINTEXA team on connected technology systems, sales and marketing platforms,
          ecommerce, and the tools that help businesses convert visitors into customers.
        </p>

        <div className="mt-12 grid gap-6">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="cx-card cx-card-interactive group"
              itemScope
              itemType="https://schema.org/BlogPosting"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
                <span className="rounded-full bg-[hsl(var(--bg-raised))] px-2.5 py-0.5 font-medium text-[hsl(var(--accent))]">
                  {post.category}
                </span>
                <time dateTime={post.date} itemProp="datePublished">
                  {new Date(post.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span aria-hidden="true">·</span>
                <span>{post.readTime} read</span>
              </div>
              <h2 className="cx-display mt-3 text-xl sm:text-2xl group-hover:text-[hsl(var(--accent))] transition-colors" itemProp="headline">
                <Link href={`/blog/${post.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] rounded">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-[hsl(var(--fg-muted))]" itemProp="description">
                {post.excerpt}
              </p>
              <meta itemProp="keywords" content={post.primaryKeyword} />
              <div className="mt-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-medium text-[hsl(var(--accent))] underline-offset-2 hover:underline"
                >
                  Read article →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated)/0.6)] p-6 sm:p-8">
          <h2 className="cx-display text-xl">Ready to grow with connected technology?</h2>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
            Explore the CINTEXA platform or create an account to access sales, marketing and commerce tools from one
            core.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/get-started" className="cx-btn cx-btn-primary">
              Create account
            </Link>
            <Link href="/platform" className="cx-btn cx-btn-secondary">
              View platform
            </Link>
            <Link href="/pricing" className="cx-btn cx-btn-secondary">
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blog;

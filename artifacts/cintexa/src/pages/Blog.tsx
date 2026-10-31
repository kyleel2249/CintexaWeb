import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import {
  CATEGORY_SERVICE,
  POSTS,
  POST_IMAGE_SIZE,
  getPost,
  postSections,
  postsNewestFirst,
  relatedPosts,
  sectionId,
} from "@/data/blog-posts";
import { blogPostCrumbs, blogSeoForSlug } from "@/data/seo-blog";
import { breadcrumbTrail, getStaticPage } from "@/data/seo-pages";
import { SERVICES } from "@/data/site-entity";
import { applyPageSeo } from "@/lib/seo-dom";

// Article text lives in src/data/blog-posts.ts (shared with the prerender, llms.txt and the sitemap).
// Re-exported so existing imports of POSTS from this module keep working.
export { POSTS };

const serviceLabel = (path: string) => SERVICES.find((s) => s.path === path)?.name ?? "CINTEXA solutions";

export function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const post = getPost(params?.slug);
  useEffect(() => applyPageSeo(blogSeoForSlug(params?.slug)), [params?.slug]);

  if (!post)
    return (
      <div className="cx-section">
        <div className="cx-container">
          <h1 className="cx-display text-3xl">Article not found</h1>
          <p className="mt-3 text-[hsl(var(--fg-muted))]">This article may have moved. Browse all articles instead.</p>
          <Link href="/blog" className="cx-btn cx-btn-primary mt-6">
            Back to blog
          </Link>
        </div>
      </div>
    );

  const related = relatedPosts(post, 3);
  const sections = postSections(post);
  const servicePath = CATEGORY_SERVICE[post.category] ?? "/platform";

  return (
    <article className="cx-section">
      <div className="cx-container max-w-3xl">
        <Breadcrumbs trail={blogPostCrumbs(post)} />
        <p className="cx-eyebrow mt-6">
          {post.category} · {post.readTime} read
        </p>
        <h1 className="cx-display mt-3 text-3xl sm:text-5xl">{post.title}</h1>
        <p className="mt-5 text-lg text-[hsl(var(--fg-muted))]">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[hsl(var(--fg-muted))]">
          <span>
            Author: <Link href="/about" className="underline">CINTEXA Editorial Team</Link>
          </span>
          <time dateTime={post.date}>Published {post.date}</time>
          {post.updated && <time dateTime={post.updated}>Updated {post.updated}</time>}
        </div>
        <img
          src={post.image}
          alt={post.imageAlt}
          width={POST_IMAGE_SIZE.width}
          height={POST_IMAGE_SIZE.height}
          className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <p className="mt-8 text-base leading-8">{post.intro}</p>

        {sections.length >= 4 && (
          <nav aria-label="Table of contents" className="cx-card mt-8">
            <p className="cx-eyebrow">In this article</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {sections.map((s) => (
                <li key={s.heading}>
                  <a href={`#${sectionId(s.heading)}`} className="text-[hsl(var(--accent))] underline">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.heading} id={sectionId(section.heading)} className="scroll-mt-24">
              <h2 className="cx-display text-2xl">{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="mt-3 leading-8 text-[hsl(var(--fg-muted))]">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-[hsl(var(--fg-muted))]">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-[hsl(var(--border))] pt-6">
          <h2 className="cx-display text-xl">Sources and further reading</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            {post.references.map((r) => (
              <li key={r.url}>
                <a className="text-[hsl(var(--accent))] underline" href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[hsl(var(--fg-muted))]">This article is general educational information, not legal, financial or cybersecurity advice for a specific situation.</p>
        </section>

        <section className="mt-10" aria-label="Related service">
          <h2 className="cx-display text-xl">How CINTEXA can help</h2>
          <p className="mt-2 text-[hsl(var(--fg-muted))]">
            Read about our{" "}
            <Link href={servicePath} className="text-[hsl(var(--accent))] underline">
              {serviceLabel(servicePath).toLowerCase()}
            </Link>{" "}
            or see <Link href="/platform" className="text-[hsl(var(--accent))] underline">all CINTEXA solutions</Link>.
          </p>
        </section>

        <section className="mt-10" aria-label="Related articles">
          <h2 className="cx-display text-xl">Related articles</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="cx-card block">
                <span className="cx-eyebrow">{r.category}</span>
                <span className="mt-2 block font-medium">{r.title}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="cx-card mt-10">
          <h2 className="cx-display text-xl">Need a digital solution for your business?</h2>
          <p className="mt-2 text-[hsl(var(--fg-muted))]">Tell CINTEXA what you are trying to improve and we can discuss a practical next step.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/get-started" className="cx-btn cx-btn-primary">
              Get started
            </Link>
            <Link href="/contact" className="cx-btn cx-btn-secondary">
              Contact CINTEXA
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Blog() {
  const page = getStaticPage("/blog")!;
  return (
    <div className="cx-section">
      <div className="cx-container max-w-5xl">
        <Breadcrumbs trail={breadcrumbTrail(page)} />
        <p className="cx-eyebrow mt-6">CINTEXA Blog</p>
        <h1 className="cx-display mt-3 text-3xl sm:text-5xl">{page.h1}</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--fg-muted))]">
          Original, practical guidance on software development, business automation, website development, SEO, e-commerce, digital marketing, CRM, cybersecurity, productivity, analytics and technology for businesses in Ghana and across Africa.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {postsNewestFirst().map((post, i) => (
            <article key={post.slug} className="cx-card cx-card-interactive overflow-hidden">
              <Link href={`/blog/${post.slug}`}>
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  width={POST_IMAGE_SIZE.width}
                  height={POST_IMAGE_SIZE.height}
                  className="aspect-[16/9] w-full rounded-xl object-cover"
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
                <p className="cx-eyebrow mt-5">
                  {post.category} · {post.readTime} read
                </p>
                <h2 className="cx-display mt-2 text-xl">{post.title}</h2>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{post.excerpt}</p>
                <p className="mt-4 text-sm font-medium text-[hsl(var(--accent))]">Read article →</p>
              </Link>
            </article>
          ))}
        </div>
        <div className="cx-card mt-10">
          <h2 className="cx-display text-xl">Have a business technology question?</h2>
          <p className="mt-2 text-[hsl(var(--fg-muted))]">Contact us to discuss a website, software project or business process improvement.</p>
          <Link href="/get-started" className="cx-btn cx-btn-primary mt-4">
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
export default Blog;

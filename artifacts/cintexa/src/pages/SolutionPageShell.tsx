import type { ReactNode } from "react";
import { Link } from "wouter";
import { AnswerBlock } from "@/components/seo/AnswerBlock";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { RelatedArticles, RelatedServices } from "@/components/seo/RelatedLinks";
import { SOLUTION_CONTENT } from "@/data/page-content";
import { breadcrumbTrail, getStaticPage } from "@/data/seo-pages";
import { SERVICES } from "@/data/site-entity";

/**
 * Shared layout for the solution pages. The page supplies its H1, intro and its own interactive visual (`children`);
 * the shell adds, from page-content.ts: breadcrumb, a direct answer, audience + problems, FAQs, related articles,
 * related services and a closing call to action. The same data feeds the prerendered HTML and the JSON-LD.
 *
 * `path` ties the page to its SEO registry entry (seo-pages.ts) and content block (page-content.ts).
 */
export function SolutionPageShell({
  eyebrow,
  title,
  intro,
  path,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  path: string;
  children: ReactNode;
}) {
  const page = getStaticPage(path);
  const id = SERVICES.find((s) => s.path === path)?.id;
  const content = id ? SOLUTION_CONTENT[id] : undefined;

  return (
    <div className="cx-section">
      <div className="cx-container">
        {page && <Breadcrumbs trail={breadcrumbTrail(page)} />}
        <p className="cx-eyebrow mt-6">{eyebrow}</p>
        <h1 className="cx-display mt-3 max-w-2xl text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-[hsl(var(--fg-muted))]">{intro}</p>
        {content && <AnswerBlock id={content.id} question={content.question} answer={content.answer} className="mt-8" />}
        <div className="mt-10">{children}</div>

        {content && (
          <>
            {(content.audience.length > 0 || content.problems.length > 0) && (
              <section className="mt-14 grid gap-4 md:grid-cols-2" aria-label="Who this is for and the problems it solves">
                <div className="cx-card">
                  <h2 className="cx-display text-xl">Who it is for</h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
                    {content.audience.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
                <div className="cx-card">
                  <h2 className="cx-display text-xl">Problems it addresses</h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
                    {content.problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            <FaqSection id={content.id} title={`${page?.socialTitle.split(" — ")[0] ?? "Service"}: common questions`} faqs={content.faqs} className="mt-14" />
            <RelatedArticles articles={content.articles} className="mt-14" />
            <RelatedServices links={content.related} className="mt-14" />

            <section className="mt-14 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-6 text-center sm:p-10" aria-labelledby="solution-cta-title">
              <h2 id="solution-cta-title" className="cx-display text-2xl sm:text-3xl">
                {content.ctaLabel}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
                Tell us what you want to improve. We reply with the questions that shape a clear scope and a written estimate.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/contact" className="cx-btn cx-btn-primary cx-btn-lg">
                  Contact CINTEXA
                </Link>
                <Link href="/get-started" className="cx-btn cx-btn-secondary cx-btn-lg">
                  Get started
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

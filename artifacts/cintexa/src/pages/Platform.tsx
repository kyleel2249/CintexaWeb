import { Link } from "wouter";
import { AnswerBlock } from "@/components/seo/AnswerBlock";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { RelatedArticles } from "@/components/seo/RelatedLinks";
import { PLATFORM_AUTOMATION_STEPS, PLATFORM_HOW_WE_WORK, SOLUTION_CONTENT } from "@/data/page-content";
import { breadcrumbTrail, getStaticPage } from "@/data/seo-pages";
import { SERVICES } from "@/data/site-entity";

/**
 * /platform — the solutions overview. Links every service page, explains business automation and answers the
 * general "what does CINTEXA do?" questions. Content lives in page-content.ts (shared with prerender + JSON-LD).
 */
export function Platform() {
  const page = getStaticPage("/platform")!;
  const c = SOLUTION_CONTENT.platform;
  return (
    <div className="cx-section">
      <div className="cx-container">
        <Breadcrumbs trail={breadcrumbTrail(page)} />
        <p className="cx-eyebrow mt-6">Solutions</p>
        <h1 className="cx-display mt-3 max-w-3xl text-3xl sm:text-5xl">{page.h1}</h1>
        <p className="mt-4 max-w-2xl text-[hsl(var(--fg-muted))]">
          CINTEXA helps businesses assess where they are, use information technology to solve practical problems, improve operations and reach customers. Choose a service below, or read how business automation works.
        </p>
        <AnswerBlock id="platform" question={c.question} answer={c.answer} className="mt-8" />

        <section className="mt-14" aria-labelledby="solutions-title">
          <h2 id="solutions-title" className="cx-display text-2xl sm:text-3xl">
            Our solutions
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <Link href={s.path} className="cx-card cx-card-interactive block h-full">
                  <h3 className="cx-display text-lg">{s.name}</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.summary}</p>
                  <p className="mt-3 text-xs text-[hsl(var(--fg-muted))]">{s.topics.join(" · ")}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-[hsl(var(--accent))]">Read about {s.name.toLowerCase()} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="automation-title">
          <p className="cx-eyebrow">Business automation</p>
          <h2 id="automation-title" className="cx-display mt-2 text-2xl sm:text-3xl">
            How business automation works
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-[hsl(var(--fg-muted))]">
            Business automation uses software to carry out repetitive, rule-based steps so people can spend their time on decisions and customers. It works best when it starts small, on one hand-off, and is measured before it is extended.
          </p>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {PLATFORM_AUTOMATION_STEPS.map((s, i) => (
              <li key={s.title} className="cx-card border-t-2 border-t-[hsl(var(--accent))]">
                <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>
                  Step {i + 1}
                </p>
                <h3 className="cx-display mt-2 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-2" aria-label="Who CINTEXA helps and the problems it solves">
          <div className="cx-card">
            <h2 className="cx-display text-xl">Who CINTEXA helps</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
              {c.audience.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div className="cx-card">
            <h2 className="cx-display text-xl">Problems we address</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--fg-muted))]">
              {c.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="how-title">
          <h2 id="how-title" className="cx-display text-2xl sm:text-3xl">
            How we work
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {PLATFORM_HOW_WE_WORK.map((s, i) => (
              <li key={s.title} className="cx-card">
                <p className="cx-eyebrow">{i + 1}</p>
                <h3 className="cx-display mt-2 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <FaqSection id="platform" title="Questions about CINTEXA's services" faqs={c.faqs} className="mt-14" />
        <RelatedArticles articles={c.articles} className="mt-14" />

        <section className="mt-14 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))] p-6 text-center sm:p-10" aria-labelledby="platform-cta-title">
          <h2 id="platform-cta-title" className="cx-display text-2xl sm:text-3xl">
            {c.ctaLabel}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
            Share what you want to improve. We reply with the questions that shape a clear scope and a written estimate.
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
      </div>
    </div>
  );
}

export default Platform;

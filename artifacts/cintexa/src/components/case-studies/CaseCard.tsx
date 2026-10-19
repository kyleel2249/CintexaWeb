import { Link } from "wouter";
import { caseImagePath, caseUrlPath, type CaseStudy } from "@/data/case-studies";
import { caseCanonical } from "@/data/case-seo";
import { ShareBar } from "@/components/ShareBar";
import { CaseBadges } from "./CaseBadges";

/** One case study on the list. Every card links to that case's own page (/case-studies/<slug>). */
export function CaseCard({ c }: { c: CaseStudy }) {
  const href = caseUrlPath(c);
  return (
    <article id={c.slug} className="flex flex-col overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))]" aria-labelledby={`${c.slug}-title`}>
      <Link href={href} tabIndex={-1} aria-hidden className="block bg-[hsl(var(--bg))]">
        <img src={caseImagePath(c)} alt="" width={1200} height={630} className="aspect-[1200/630] w-full object-cover" loading="lazy" decoding="async" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <CaseBadges c={c} />
        <h2 id={`${c.slug}-title`} className="cx-display text-xl">
          <Link href={href} className="hover:underline">
            {c.title}
          </Link>
        </h2>
        <p className="text-sm leading-relaxed text-[hsl(var(--fg-muted))]">{c.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[hsl(var(--border))] pt-4">
          <Link href={href} className="cx-btn cx-btn-primary cx-btn-sm">
            Read case study
          </Link>
        </div>
        <ShareBar url={caseCanonical(c)} title={c.title} text={c.title} compact />
      </div>
    </article>
  );
}

import { STATUS_LABEL, readingMinutes, type CaseStudy } from "@/data/case-studies";

/** Status, service, industry and reading time. "Illustrative" is always stated, never hidden. */
export function CaseBadges({ c }: { c: CaseStudy }) {
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Case study details">
      <li>
        <span className={c.status === "verified" ? "cx-badge cx-badge-success" : "cx-badge cx-badge-warning"}>{STATUS_LABEL[c.status]}</span>
      </li>
      <li>
        <span className="cx-badge">{c.service}</span>
      </li>
      <li>
        <span className="cx-badge">{c.industry}</span>
      </li>
      <li className="text-xs text-[hsl(var(--fg-muted))]">{readingMinutes(c)} min read</li>
    </ul>
  );
}

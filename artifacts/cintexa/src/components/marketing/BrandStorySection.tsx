import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { BrandMark } from "@/components/brand/logo";

const STEPS = [
  {
    title: "Assess",
    copy: "Understand performance, customers, operations, and technology gaps with a clear business assessment.",
  },
  {
    title: "Apply technology",
    copy: "Software, websites, automation, analytics, and growth systems designed around how people actually work.",
  },
  {
    title: "Improve & grow",
    copy: "Teams make better decisions, reach the right customers, and create measurable, sustainable growth.",
  },
];

/**
 * Human-centered brand narrative under the hero — people + IT + growth.
 */
export function BrandStorySection() {
  return (
    <section className="cx-section border-t border-[hsl(var(--border))]">
      <div className="cx-container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark size="md" />
          </div>
          <p className="cx-eyebrow">People + information technology</p>
          <h2 className="cx-display mt-2 text-2xl sm:text-3xl">
            Technology that works for people and businesses
          </h2>
          <p className="mt-3 text-[hsl(var(--fg-muted))]">
            CINTEXA helps businesses assess where they are, use Information Technology to solve
            problems, improve how they operate, reach customers, and create opportunities for growth.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 0.08}>
              <div className="cx-card h-full border-t-2 border-t-[hsl(var(--accent))]">
                <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="cx-display mt-2 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.copy}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

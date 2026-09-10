import { Link } from "wouter";
import { motion } from "framer-motion";
import { EcosystemHero } from "@/components/hero/EcosystemHero";
import { GlowField } from "@/components/decorative/GlowField";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { PointerParallax } from "@/components/motion/PointerParallax";
import { SignupBanner } from "@/components/marketing/SignupBanner";
import { useMotion } from "@/components/motion/MotionProvider";

const WORDS = ["TECHNOLOGY", "COMMERCE", "MOTION", "INTELLIGENCE", "GROWTH", "PRECISION", "TRUST", "SPEED", "INNOVATION"];

const PILLARS = [
  { title: "Marketing technology", copy: "Plan campaigns and track channel performance from one workspace.", href: "/solutions/marketing", accent: "sky" as const },
  { title: "Sales technology", copy: "Move visitors to loyal customers with a pipeline built for repeat growth.", href: "/solutions/sales", accent: "teal" as const },
  { title: "Ads Boost", copy: "Run programmatic campaigns with a live lifecycle view, start to revenue.", href: "/solutions/ads-boost", accent: "accent" as const },
  { title: "E-commerce", copy: "A full commerce toolkit: catalog, checkout, and a 3D storefront demo.", href: "/solutions/ecommerce", accent: "violet" as const },
];

export function Home() {
  const { allowMotion } = useMotion();

  return (
    <>
      <section className="relative overflow-hidden cx-section">
        <GlowField />
        <div className="cx-container relative grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <motion.div
            initial={allowMotion ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="cx-eyebrow">A growth platform for teams building their next stage of scale</p>
            <h1 className="cx-display mt-4 text-4xl sm:text-5xl lg:text-6xl">
              Run technology, commerce, and marketing from one connected core.
            </h1>
            <p className="mt-5 max-w-md text-base text-[hsl(var(--fg-muted))]">
              CINTEXA gives growing teams a single platform for lead generation, customer accounts,
              and the tooling that turns first-time visitors into a loyal customer base.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/get-started" className="cx-btn cx-btn-primary cx-btn-lg">
                Get started
              </Link>
              <Link href="/platform" className="cx-btn cx-btn-secondary cx-btn-lg">
                See the platform
              </Link>
            </div>
          </motion.div>
          <PointerParallax strength={14}>
            <EcosystemHero />
          </PointerParallax>
        </div>
      </section>

      <section className="border-y border-[hsl(var(--border))] py-6">
        <div className="cx-container flex flex-wrap justify-center gap-x-8 gap-y-2">
          {WORDS.map((w) => (
            <span key={w} className="cx-eyebrow" style={{ color: "hsl(var(--fg-muted))" }}>
              {w}
            </span>
          ))}
        </div>
      </section>

      <SignupBanner />

      <section className="cx-section">
        <div className="cx-container">
          <h2 className="cx-display text-2xl sm:text-3xl">Four surfaces, one platform</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <ScrollReveal key={p.href} delay={i * 0.08}>
                <Link href={p.href}>
                  <div
                    className="cx-card cx-card-interactive h-full border-t-2"
                    style={{ borderTopColor: `hsl(var(--${p.accent}))` }}
                  >
                    <h3 className="cx-display text-lg">{p.title}</h3>
                    <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{p.copy}</p>
                    <span className="mt-4 inline-block text-sm font-medium" style={{ color: `hsl(var(--${p.accent}))` }}>
                      Explore
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

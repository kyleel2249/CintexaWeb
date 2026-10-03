import { Link } from "wouter";
import { motion } from "framer-motion";
import { EcosystemHero } from "@/components/hero/EcosystemHero";
import { BrandStorySection } from "@/components/marketing/BrandStorySection";
import { GlowField } from "@/components/decorative/GlowField";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { PointerParallax } from "@/components/motion/PointerParallax";
import { SignupBanner } from "@/components/marketing/SignupBanner";
import { useMotion } from "@/components/motion/MotionProvider";

const WORDS = [
  "TECHNOLOGY",
  "COMMERCE",
  "MOTION",
  "INTELLIGENCE",
  "GROWTH",
  "PRECISION",
  "TRUST",
  "SPEED",
  "INNOVATION",
];

const PILLARS = [
  {
    title: "Marketing technology",
    copy: "Plan campaigns and track channel performance from one workspace.",
    href: "/solutions/marketing",
    accent: "sky" as const,
  },
  {
    title: "Sales technology",
    copy: "Move visitors to loyal customers with a pipeline built for repeat growth.",
    href: "/solutions/sales",
    accent: "teal" as const,
  },
  {
    title: "Ads Boost",
    copy: "Run programmatic campaigns with a live lifecycle view, start to revenue.",
    href: "/solutions/ads-boost",
    accent: "accent" as const,
  },
  {
    title: "E-commerce",
    copy: "A full commerce toolkit: catalog, checkout, and a 3D storefront preview.",
    href: "/solutions/ecommerce",
    accent: "violet" as const,
  },
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
            <p className="cx-eyebrow">People + information technology + growth</p>
            <h1 className="cx-display mt-4 text-4xl sm:text-5xl lg:text-6xl">
              Technology that helps your business understand, improve, and grow.
            </h1>
            <p className="mt-5 max-w-md text-base text-[hsl(var(--fg-muted))]">
              CINTEXA helps businesses assess where they are, use Information Technology to solve
              problems, improve operations, reach customers, and create measurable growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/get-started" className="cx-btn cx-btn-primary cx-btn-lg">
                Start Growing
              </Link>
              <Link href="/platform" className="cx-btn cx-btn-secondary cx-btn-lg">
                Explore Solutions
              </Link>
            </div>
          </motion.div>
          <PointerParallax strength={10}>
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

      <section className="cx-section !py-8 border-t border-[hsl(var(--border))]">
        <div className="cx-container">
          <ScrollReveal>
            <Link
              href="/solutions/marketing"
              className="group relative block overflow-hidden rounded-2xl border border-[hsl(var(--border))] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--accent))]"
              aria-label="CINTEXA marketing — grow your brand. Brand strategy, social media, digital campaigns, content, SEO and analytics."
            >
              <img
                src="/images/cintexa-marketing-banner.png"
                alt="CINTEXA marketing: Let's turn your marketing goals into reality. Brand strategy, social media marketing, digital campaigns, content creation, SEO and analytics. Grow your brand with CINTEXA."
                width={1920}
                height={1080}
                className="h-auto w-full object-cover object-center"
                loading="eager"
                decoding="async"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:h-20" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <BrandStorySection />

      <SignupBanner />

      <section className="cx-section border-t border-[hsl(var(--border))]">
        <div className="cx-container max-w-2xl">
          <p className="cx-eyebrow">Connected systems</p>
          <h2 className="cx-display mt-2 text-2xl sm:text-3xl">One ecosystem. Every growth surface.</h2>
          <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
            Marketing, sales, advertising, and commerce linked so people can act on real
            information—not disconnected tools.
          </p>
        </div>
      </section>

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
                    <span
                      className="mt-4 inline-block text-sm font-medium"
                      style={{ color: `hsl(var(--${p.accent}))` }}
                    >
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

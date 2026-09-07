import { Link } from "wouter";
import { motion } from "framer-motion";
import { EcosystemHero } from "@/components/hero/EcosystemHero";
import { useMotion } from "@/components/motion/MotionProvider";

const WORDS = ["TECHNOLOGY", "COMMERCE", "MOTION", "INTELLIGENCE", "GROWTH", "PRECISION", "TRUST", "SPEED", "INNOVATION"];

const PILLARS = [
  { title: "Marketing technology", copy: "Plan campaigns and track channel performance from one workspace.", href: "/solutions/marketing" },
  { title: "Sales technology", copy: "Move visitors to loyal customers with a pipeline built for repeat growth.", href: "/solutions/sales" },
  { title: "Ads Boost", copy: "Run programmatic campaigns with a live lifecycle view, start to revenue.", href: "/solutions/ads-boost" },
  { title: "E-commerce", copy: "A full commerce toolkit: catalog, checkout, and a 3D storefront demo.", href: "/solutions/ecommerce" },
];

export function Home() {
  const { allowMotion } = useMotion();

  return (
    <>
      <section className="cx-section">
        <div className="cx-container grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <motion.div
            initial={allowMotion ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="cx-eyebrow">A growth platform, not a static site</p>
            <h1 className="cx-display mt-4 text-4xl sm:text-5xl lg:text-6xl">
              Run technology, commerce, and marketing from one connected core.
            </h1>
            <p className="mt-5 max-w-md text-base text-[hsl(var(--fg-muted))]">
              CINTEXA gives growing teams a single platform for lead generation, customer accounts,
              and the tooling that turns first-time visitors into a loyal customer base.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pricing" className="cx-btn cx-btn-primary cx-btn-lg">
                Start building
              </Link>
              <Link href="/platform" className="cx-btn cx-btn-secondary cx-btn-lg">
                See the platform
              </Link>
            </div>
          </motion.div>
          <EcosystemHero />
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

      <section className="cx-section">
        <div className="cx-container">
          <h2 className="cx-display text-2xl sm:text-3xl">Four surfaces, one platform</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <Link key={p.href} href={p.href}>
                <div className="cx-card cx-card-interactive h-full">
                  <h3 className="cx-display text-lg">{p.title}</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{p.copy}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-[hsl(var(--accent))]">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

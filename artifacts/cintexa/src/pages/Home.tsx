import { Link } from "wouter";
import { motion } from "framer-motion";
import { EcosystemHero } from "@/components/hero/EcosystemHero";
import { HeroCarousel3D } from "@/components/hero/HeroCarousel3D";
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
      {/* Small CINTEXA favicon glides across the top in a continuous 3D motion. */}
      <div
        className="relative h-12 w-full overflow-hidden"
        aria-label="CINTEXA animated brand mark"
      >
        <motion.div
          className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center justify-center"
          initial={false}
          animate={
            allowMotion
              ? { x: ["-8vw", "calc(100vw - 42px)"], rotateY: [0, 360], rotateZ: [0, 8, -8, 0] }
              : { x: "calc(50vw - 18px)", rotateY: 0, rotateZ: 0 }
          }
          transition={
            allowMotion
              ? {
                  x: { duration: 9, ease: "linear", repeat: Infinity, repeatType: "loop" },
                  rotateY: { duration: 3.5, ease: "linear", repeat: Infinity, repeatType: "loop" },
                  rotateZ: { duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatType: "loop" },
                }
              : { duration: 0 }
          }
          style={{ perspective: 700, transformStyle: "preserve-3d" }}
        >
          <img
            src="/favicon.svg"
            alt="CINTEXA"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg shadow-[0_8px_20px_rgba(245,197,24,0.3)]"
            draggable={false}
          />
        </motion.div>
      </div>
      <HeroCarousel3D className="pt-4 sm:pt-6" />

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

      <section className="cx-section border-t border-[hsl(var(--border))]">
        <div className="cx-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="cx-eyebrow">What we do</p><h2 className="cx-display mt-2 text-2xl sm:text-3xl">Digital solutions for real business needs</h2></div>
            <Link href="/about" className="text-sm font-medium text-[hsl(var(--accent))] underline">About CINTEXA →</Link>
          </div>
          <p className="mt-4 max-w-3xl leading-7 text-[hsl(var(--fg-muted))]">CINTEXA serves small and medium-sized businesses, founders and teams that need better digital experiences or more organised operations. We plan and build websites, custom software, e-commerce experiences, sales and marketing systems, automation workflows and data-informed business tools.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[["Software development","Custom applications shaped around the work your team needs to do.","/solutions/software-development"],["Website development","Responsive, accessible websites that explain services and help visitors take action.","/solutions/website-development"],["E-commerce","Product catalogues and online selling experiences with clear order workflows.","/solutions/ecommerce"],["Business automation","Reduce repetitive hand-offs with validated forms, connected records and useful notifications.","/platform"],["Digital marketing & SEO","Build discoverable content, measure campaigns and improve the path from visit to enquiry.","/solutions/marketing"],["Sales & CRM workflows","Keep lead ownership, customer history and next actions visible to the right people.","/solutions/sales"]].map(([title,copy,href]) => <Link key={title} href={href} className="cx-card cx-card-interactive block"><h3 className="cx-display text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--fg-muted))]">{copy}</p><span className="mt-4 inline-block text-sm font-medium text-[hsl(var(--accent))]">Explore solution →</span></Link>)}
          </div>
        </div>
      </section>

      <section className="cx-section">
        <div className="cx-container">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="cx-eyebrow">Latest articles</p><h2 className="cx-display mt-2 text-2xl sm:text-3xl">Practical advice for business technology</h2></div><Link href="/blog" className="text-sm font-medium text-[hsl(var(--accent))] underline">Visit the blog →</Link></div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[["Business Automation for Small Businesses: Where to Start","/blog/business-automation-for-small-businesses","Business automation"],["Technical SEO Checklist for a Business Website","/blog/technical-seo-checklist-for-business-websites","SEO"],["Cybersecurity Basics for Small Businesses in Ghana","/blog/cybersecurity-basics-for-small-businesses-in-ghana","Cybersecurity"]].map(([title,href,category]) => <article key={href} className="cx-card"><p className="cx-eyebrow">{category}</p><h3 className="cx-display mt-2 text-lg">{title}</h3><Link href={href} className="mt-4 inline-block text-sm font-medium text-[hsl(var(--accent))] underline">Read article →</Link></article>)}
          </div>
        </div>
      </section>

      <section className="cx-section border-y border-[hsl(var(--border))]">
        <div className="cx-container grid gap-8 md:grid-cols-2">
          <div><p className="cx-eyebrow">Case studies</p><h2 className="cx-display mt-2 text-2xl sm:text-3xl">See how solutions are planned and measured</h2><p className="mt-3 leading-7 text-[hsl(var(--fg-muted))]">Explore clearly labelled illustrative scenarios covering website enquiries, e-commerce operations and workflow automation. We do not invent client names or performance results.</p><Link href="/case-studies" className="cx-btn cx-btn-secondary mt-5">View case studies</Link></div>
          <div className="cx-card"><p className="cx-eyebrow">Careers & opportunities</p><h3 className="cx-display mt-2 text-xl">Explore current vacancies and career updates</h3><p className="mt-3 text-sm leading-6 text-[hsl(var(--fg-muted))]">Review listed opportunities, application requirements and career alerts on the CINTEXA careers page.</p><Link href="/careers" className="cx-btn cx-btn-primary mt-5">Visit careers</Link></div>
        </div>
      </section>

      <section className="cx-section">
        <div className="cx-container cx-card flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="cx-eyebrow">Start a conversation</p><h2 className="cx-display mt-2 text-2xl">Tell us what your business needs to improve.</h2><p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Share your goals, project requirements and current challenges.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/get-started" className="cx-btn cx-btn-primary">Get started</Link><Link href="/contact" className="cx-btn cx-btn-secondary">Contact us</Link></div>
        </div>
      </section>
    </>
  );
}

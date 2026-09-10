import { Link } from "wouter";
import { motion } from "framer-motion";
import { GlowField } from "@/components/decorative/GlowField";
import { GsapStagger } from "@/components/motion/GsapStagger";
import { useMotion } from "@/components/motion/MotionProvider";
import { currentPlatformFeeRate, hasActivePromo, PROMO_CODE } from "@/lib/platform-economics";

const STEPS = [
  {
    n: "1",
    title: "Create your free account",
    copy: "No card required. Takes about a minute.",
    color: "sky" as const,
  },
  {
    n: "2",
    title: "Tell us what you do",
    copy: "Creator, seller, buyer, or affiliate — your dashboard tailors itself to you.",
    color: "violet" as const,
  },
  {
    n: "3",
    title: "Start growing",
    copy: "Marketing, sales, ads, and commerce tools, live from day one.",
    color: "accent" as const,
  },
];

/** Animated promo banner: signup steps + the current fee offer, replacing the old static metrics band. */
export function SignupBanner() {
  const { allowMotion } = useMotion();
  const feePct = (currentPlatformFeeRate() * 100).toFixed(0);
  const keepPct = (100 - currentPlatformFeeRate() * 100).toFixed(0);
  const promoActive = hasActivePromo();

  return (
    <section className="relative overflow-hidden border-y border-[hsl(var(--border))] cx-section !py-14">
      <GlowField />
      <div className="cx-container relative">
        <div className="text-center">
          <motion.p
            className="cx-eyebrow"
            initial={allowMotion ? { opacity: 0, y: 8 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {promoActive ? `Promo ${PROMO_CODE} active` : `Use promo code ${PROMO_CODE} at signup`}
          </motion.p>
          <motion.h2
            className="cx-display mt-2 text-2xl sm:text-3xl"
            initial={allowMotion ? { opacity: 0, y: 12 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Keep {keepPct}% of every sale — up and running in three steps
          </motion.h2>
          <motion.p
            className="mt-3 text-sm text-[hsl(var(--fg-muted))]"
            initial={allowMotion ? { opacity: 0 } : false}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Platform fee is {feePct}% on sales processed through CINTEXA — no setup fees, no monthly minimum.
          </motion.p>
        </div>

        <GsapStagger className="relative mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="cx-card h-full text-center">
              <div
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                style={{ background: `hsl(var(--${s.color}) / 0.15)`, color: `hsl(var(--${s.color}))` }}
              >
                {s.n}
              </div>
              <h3 className="cx-display mt-4 text-base">{s.title}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{s.copy}</p>
            </div>
          ))}
        </GsapStagger>

        <div className="mt-10 flex justify-center">
          <Link href="/get-started" className="cx-btn cx-btn-primary cx-btn-lg">
            Get started free
          </Link>
        </div>
      </div>
    </section>
  );
}

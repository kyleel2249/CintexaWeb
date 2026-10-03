import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useMotion } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    id: "challenge",
    src: "/images/carousel/01-challenge.png",
    alt: "Challenge — Every business has a challenge. Leaders need clearer insight into performance, customers, and systems.",
    href: "/get-started",
  },
  {
    id: "assessment",
    src: "/images/carousel/02-assessment.png",
    alt: "Assessment — CINTEXA helps you see where you are. Business assessment across sales, marketing, operations, technology, and growth.",
    href: "/platform",
  },
  {
    id: "technology",
    src: "/images/carousel/03-technology.png",
    alt: "Technology solves real problems. Software, websites, automation, analytics, and customer growth systems built for how teams work.",
    href: "/platform",
  },
  {
    id: "web-dev",
    src: "/images/carousel/04-web-development.png",
    alt: "Professional web development solutions — modern, fast, secure, scalable websites and web applications.",
    href: "/solutions/website-development",
  },
  {
    id: "automation",
    src: "/images/carousel/05-business-automation.png",
    alt: "Business automation — work smarter, grow faster. Process automation, cloud solutions, workflow optimization.",
    href: "/platform",
  },
  {
    id: "logo",
    src: "/images/carousel/06-cintexa-logo.png",
    alt: "CINTEXA — Technology that helps businesses understand, improve, and grow.",
    href: "/",
  },
  {
    id: "software",
    src: "/images/carousel/07-software-development.png",
    alt: "Software development — custom solutions, real impact. Mobile apps, cloud, API integration, maintenance.",
    href: "/solutions/software-development",
  },
  {
    id: "marketing",
    src: "/images/carousel/08-marketing.png",
    alt: "Let's turn your marketing goals into reality. Brand strategy, social media, digital campaigns, content, SEO.",
    href: "/solutions/marketing",
  },
  {
    id: "growth",
    src: "/images/carousel/09-growth.png",
    alt: "Growth through smart systems. Assessment to technology to better decisions to measurable growth.",
    href: "/get-started",
  },
] as const;

/** Hold each slide for 5 seconds before advancing. */
const SLIDE_MS = 5000;

/**
 * Premium 3D-style hero carousel — perspective tilt, depth shadow, crossfade.
 * Respects prefers-reduced-motion (static first slide, no auto-advance).
 */
export function HeroCarousel3D({ className }: { className?: string }) {
  const { allowMotion, reducedMotion } = useMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (reducedMotion || !allowMotion || paused) return;
    const id = window.setInterval(() => go(index + 1), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [index, allowMotion, reducedMotion, paused, go]);

  const slide = SLIDES[index];

  return (
    <section
      className={cn("relative w-full overflow-hidden", className)}
      aria-roledescription="carousel"
      aria-label="CINTEXA brand and solutions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* 3D stage */}
      <div
        className="relative mx-auto max-w-[1400px] px-3 sm:px-6"
        style={{ perspective: "1400px" }}
      >
        <div
          className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))] shadow-[0_25px_80px_-20px_rgba(0,0,0,0.55)]"
          style={{
            transformStyle: "preserve-3d",
            transform: allowMotion && !reducedMotion ? "rotateX(1.5deg)" : undefined,
          }}
        >
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                initial={
                  allowMotion && !reducedMotion
                    ? { opacity: 0, rotateY: 12, z: -40, scale: 0.96 }
                    : { opacity: 0 }
                }
                animate={
                  allowMotion && !reducedMotion
                    ? { opacity: 1, rotateY: 0, z: 0, scale: 1 }
                    : { opacity: 1 }
                }
                exit={
                  allowMotion && !reducedMotion
                    ? { opacity: 0, rotateY: -12, z: -40, scale: 0.96 }
                    : { opacity: 0 }
                }
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Link href={slide.href} className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--accent))]">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    width={1920}
                    height={1080}
                    className="h-full w-full object-cover object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Edge vignette for depth */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.35)",
            }}
          />
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--fg-muted))] transition-colors hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))]"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide indicators">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1}: ${s.id}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index
                    ? "w-6 bg-[hsl(var(--accent))]"
                    : "w-1.5 bg-[hsl(var(--fg-muted)/.35)] hover:bg-[hsl(var(--fg-muted)/.6)]",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--fg-muted))] transition-colors hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))]"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}

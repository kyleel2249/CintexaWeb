import { useEffect, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { BrandMark } from "@/components/brand/logo";

/**
 * Cinematic 5-beat brand story using real business / IT photography.
 * Plays once on mount (loops gently when motion allowed).
 * Beats mirror the GOD-MODE brand reveal: challenge → assessment →
 * solutions → growth → CINTEXA hold.
 */
const BEATS = [
  {
    id: "challenge",
    label: "0.0–0.7s · Challenge",
    title: "Every business has a challenge",
    copy: "Leaders need clearer insight into performance, customers, and systems.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    alt: "Business professional examining performance data on a laptop",
  },
  {
    id: "assessment",
    label: "0.7–1.6s · Assessment",
    title: "CINTEXA helps you see where you are",
    copy: "Business assessment across sales, marketing, operations, technology, and growth opportunities.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    alt: "Analytics dashboard and business assessment charts on screen",
  },
  {
    id: "solutions",
    label: "1.6–2.7s · Technology",
    title: "People use technology to solve real problems",
    copy: "Software, websites, automation, analytics, and customer growth systems—built for how teams work.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    alt: "Diverse team collaborating with laptops and digital tools",
  },
  {
    id: "growth",
    label: "2.7–3.5s · Growth",
    title: "Systems improve. Confidence grows.",
    copy: "Assessment → technology → better decisions → measurable growth.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    alt: "Business growth charts and team reviewing results",
  },
  {
    id: "logo",
    label: "4.1–5.0s · CINTEXA",
    title: "CINTEXA",
    copy: "Technology that helps businesses understand, improve, and grow.",
    image: null as string | null,
    alt: "CINTEXA brand mark",
  },
] as const;

const BEAT_MS = 1000;

export function BrandRevealSequence() {
  const { allowMotion } = useMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!allowMotion) {
      setIndex(BEATS.length - 1);
      return;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BEATS.length);
    }, BEAT_MS);
    return () => window.clearInterval(id);
  }, [allowMotion]);

  const beat = BEATS[index];

  return (
    <div
      className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-2xl"
      style={{ background: "#0B0F14" }}
      role="img"
      aria-label="CINTEXA brand story: challenge, assessment, technology, growth, and brand reveal"
    >
      {beat.image ? (
        <img
          key={beat.id}
          src={beat.image}
          alt={beat.alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 42%, hsl(45 90% 53% / 0.2), transparent 55%)",
            }}
          />
          <BrandMark size="lg" />
          <p
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "1.85rem",
              letterSpacing: "-0.01em",
              color: "#F7F4EE",
              margin: 0,
            }}
          >
            CINTEXA
          </p>
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            beat.image != null
              ? "linear-gradient(to top, rgba(11,15,20,0.92) 0%, rgba(11,15,20,0.35) 45%, rgba(11,15,20,0.2) 100%)"
              : undefined,
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <p className="cx-eyebrow" style={{ color: "#F5C518" }}>
          {beat.label}
        </p>
        <h3
          className="mt-1 text-lg font-semibold sm:text-xl"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            color: "#F7F4EE",
            letterSpacing: "-0.01em",
          }}
        >
          {beat.title}
        </h3>
        <p className="mt-1 text-sm" style={{ color: "rgba(247,244,238,0.72)" }}>
          {beat.copy}
        </p>
      </div>

      <div className="absolute left-0 right-0 top-3 flex justify-center gap-1.5 px-4">
        {BEATS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Show ${b.title}`}
            onClick={() => setIndex(i)}
            className="h-1 flex-1 max-w-[3rem] rounded-full transition-colors"
            style={{
              background: i === index ? "#F5C518" : "rgba(247,244,238,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

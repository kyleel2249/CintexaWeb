export type LogoSize = "sm" | "md" | "lg";
type Variant = "default" | "inverse" | "mono";

const SIZE_PX: Record<LogoSize, number> = { sm: 24, md: 32, lg: 44 };

const VARIANT_COLORS: Record<Variant, { square: string; orbit: string; node: string }> = {
  default: { square: "#F5C518", orbit: "#0B0F14", node: "#0B0F14" },
  inverse: { square: "#0B0F14", orbit: "#F5C518", node: "#F5C518" },
  mono: { square: "currentColor", orbit: "#0B0F14", node: "#0B0F14" },
};

/**
 * BrandMark — amber square (10px corner radius on a 32px grid), an orbit
 * circle, a diagonal axis, and a center node. Always 1:1. Never stretch/skew.
 */
export function BrandMark({ size = "md", variant = "default", className }: { size?: LogoSize; variant?: Variant; className?: string }) {
  const px = SIZE_PX[size];
  const c = VARIANT_COLORS[variant];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="CINTEXA"
    >
      <rect x="0" y="0" width="32" height="32" rx="10" fill={c.square} />
      <circle cx="16" cy="16" r="9" stroke={c.orbit} strokeWidth="1.6" opacity="0.85" />
      <line x1="7" y1="25" x2="25" y2="7" stroke={c.orbit} strokeWidth="1.6" opacity="0.55" />
      <circle cx="16" cy="16" r="2.4" fill={c.node} />
    </svg>
  );
}

export function BrandWordmark({ variant = "default", className }: { variant?: Variant; className?: string }) {
  const color = variant === "inverse" ? "#0B0F14" : "#F7F4EE";
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: "1.05rem",
        letterSpacing: "-0.01em",
        color,
      }}
    >
      CINTEXA
    </span>
  );
}

/** Full lockup: mark + wordmark, always aligned on the same baseline. */
export function BrandLogo({ size = "md", variant = "default", className }: { size?: LogoSize; variant?: Variant; className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
      <BrandMark size={size} variant={variant} />
      <BrandWordmark variant={variant} />
    </span>
  );
}

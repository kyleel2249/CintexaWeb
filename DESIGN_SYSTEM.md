# CINTEXA Design System

One connected product language for the public site and customer platform.

## Brand identity

### Logo
- **Component:** `BrandMark`, `BrandWordmark`, `BrandLogo` in `src/components/brand/`
- **Geometry:** Amber square (radius 10px) + orbit circle + diagonal axis + center node
- **Rules:** Always 1:1 aspect ratio; never stretch or skew; approved variants default/inverse/mono

### Brand words
TECHNOLOGY · COMMERCE · MOTION · INTELLIGENCE · GROWTH · PRECISION · TRUST · SPEED · INNOVATION

## Typography
- Display/Title: Space Grotesk (`font-display`)
- Body: Manrope
- Mono/eyebrows: DM Mono

## Tokens
See `artifacts/cintexa/src/styles/design-system.css` for spacing, buttons (`.cx-btn-*`), cards, forms, navigation, shadows, motion, and responsive utilities.

## 3D & motion
Governed by `useMotionProfile` — WebGL ecosystem scene with pure CSS fallback for non-3D browsers. Documented in `MOTION.md`.

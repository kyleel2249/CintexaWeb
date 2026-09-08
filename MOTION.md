# Motion & 3D system

## Technologies
- React Three Fiber + Three.js — hero ecosystem scene (`BusinessEcosystem3D`), pauses its render
  loop entirely when scrolled off-screen (IntersectionObserver + `frameloop="never"`)
- Framer Motion — scroll reveals (`ScrollReveal`), pointer parallax (`PointerParallax`), mobile nav,
  dropdowns
- GSAP + ScrollTrigger — section choreography (`GsapStagger`, used on the Platform module grid)
- CSS 3D / SVG / Canvas — mockups, funnel, journey, ads field

## Performance profile (`useMotionProfile`)
| Signal | Effect |
|--------|--------|
| prefers-reduced-motion | Disables 3D, GSAP, Framer; static fallbacks |
| Mobile + low cores/memory | 3D off or lighter |
| Save-Data / 2G–3G | 3D disabled |
| Off-screen canvas | Render loop pauses (`BusinessEcosystem3D`) |

## Fallbacks
- `EcosystemFallback` — pure CSS orbital ecosystem when WebGL unavailable
- `ScrollReveal` / `PointerParallax` — render as plain static content (no observers, no listeners)
  when `allowMotion` is false

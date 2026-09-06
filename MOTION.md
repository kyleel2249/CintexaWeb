# Motion & 3D system

## Technologies
- React Three Fiber + Three.js — hero ecosystem scene
- Framer Motion — scroll reveals, mobile nav, dropdowns
- GSAP + ScrollTrigger — section choreography
- CSS 3D / SVG / Canvas — mockups, funnel, journey, ads field

## Performance profile (`useMotionProfile`)
| Signal | Effect |
|--------|--------|
| prefers-reduced-motion | Disables 3D, GSAP, Framer; static fallbacks |
| Mobile + low cores/memory | 3D off or lighter |
| Save-Data / 2G–3G | 3D disabled |
| Off-screen canvas | Animation pauses |

## Fallbacks
- `EcosystemFallback` — pure CSS orbital ecosystem when WebGL unavailable
- ScrollReveal / PointerParallax become static when motion is off

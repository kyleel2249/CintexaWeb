/**
 * Compact CINTEXA mark that travels continuously around a spin circle.
 * Perspective stage, dual rings, gold glows, breathing shadow.
 * Honors prefers-reduced-motion.
 */
export function AuthLogo3D({ size = 40 }: { size?: number }) {
  return (
    <div className="cx-auth-logo" style={{ ["--logo-size" as string]: `${size}px` }} aria-hidden>
      <div className="cx-auth-logo__stage">
        <div className="cx-auth-logo__glow cx-auth-logo__glow--a" />
        <div className="cx-auth-logo__glow cx-auth-logo__glow--b" />
        <div className="cx-auth-logo__ring cx-auth-logo__ring--outer" />
        <div className="cx-auth-logo__ring cx-auth-logo__ring--inner" />

        {/* Rotating carrier — logo rides the circle */}
        <div className="cx-auth-logo__spin">
          <div className="cx-auth-logo__mark-wrap">
            <img
              src="/favicon.svg"
              alt=""
              width={size}
              height={size}
              className="cx-auth-logo__mark"
              draggable={false}
            />
          </div>
        </div>

        <div className="cx-auth-logo__shadow" />
      </div>
      <style>{`
        .cx-auth-logo {
          --logo-size: 40px;
          --orbit: calc(var(--logo-size) * 1.55);
          display: flex;
          justify-content: center;
          align-items: center;
          height: calc(var(--orbit) * 2 + var(--logo-size) * 0.35);
          margin: 0 auto 0.15rem;
        }
        .cx-auth-logo__stage {
          position: relative;
          width: calc(var(--orbit) * 2 + var(--logo-size));
          height: calc(var(--orbit) * 2 + var(--logo-size));
          perspective: 1200px;
          transform-style: preserve-3d;
        }
        /* Continuous spin around the circle */
        .cx-auth-logo__spin {
          position: absolute;
          inset: 50% auto auto 50%;
          width: 0;
          height: 0;
          transform-style: preserve-3d;
          animation: cx-auth-spin 7s linear infinite;
          z-index: 3;
        }
        .cx-auth-logo__mark-wrap {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--logo-size);
          height: var(--logo-size);
          /* Sit on the ring path */
          transform: translate(-50%, calc(-1 * var(--orbit))) rotateX(8deg);
          transform-style: preserve-3d;
          /* Counter-rotate so the mark stays upright while orbiting */
          animation: cx-auth-counter 7s linear infinite;
        }
        .cx-auth-logo__mark {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 22%;
          box-shadow:
            0 6px 18px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(245, 197, 24, 0.3),
            0 0 16px rgba(245, 197, 24, 0.2);
        }
        .cx-auth-logo__ring {
          position: absolute;
          inset: 50% auto auto 50%;
          border-radius: 50%;
          pointer-events: none;
          z-index: 2;
          transform-style: preserve-3d;
        }
        .cx-auth-logo__ring--outer {
          width: calc(var(--orbit) * 2);
          height: calc(var(--orbit) * 2);
          margin: calc(var(--orbit) * -1) 0 0 calc(var(--orbit) * -1);
          border: 1.5px solid rgba(245, 197, 24, 0.4);
          box-shadow: 0 0 14px rgba(245, 197, 24, 0.12);
          animation: cx-auth-ring-tilt-a 10s linear infinite;
        }
        .cx-auth-logo__ring--inner {
          width: calc(var(--orbit) * 1.55);
          height: calc(var(--orbit) * 1.55);
          margin: calc(var(--orbit) * -0.775) 0 0 calc(var(--orbit) * -0.775);
          border: 1px dashed rgba(245, 197, 24, 0.28);
          animation: cx-auth-ring-tilt-b 8s linear infinite;
        }
        .cx-auth-logo__shadow {
          position: absolute;
          left: 50%;
          bottom: 8%;
          width: calc(var(--logo-size) * 1.4);
          height: 8px;
          margin-left: calc(var(--logo-size) * -0.7);
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.5) 0%, transparent 70%);
          filter: blur(3px);
          animation: cx-auth-shadow 7s linear infinite;
          z-index: 1;
        }
        .cx-auth-logo__glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(16px);
        }
        .cx-auth-logo__glow--a {
          width: 65%;
          height: 65%;
          top: 8%;
          left: 8%;
          background: radial-gradient(circle, rgba(245, 197, 24, 0.32) 0%, transparent 70%);
          animation: cx-auth-glow-a 6s ease-in-out infinite;
        }
        .cx-auth-logo__glow--b {
          width: 50%;
          height: 50%;
          bottom: 10%;
          right: 6%;
          background: radial-gradient(circle, rgba(245, 197, 24, 0.2) 0%, transparent 70%);
          animation: cx-auth-glow-b 7.5s ease-in-out infinite;
        }
        @keyframes cx-auth-spin {
          from { transform: rotateZ(0deg); }
          to { transform: rotateZ(360deg); }
        }
        @keyframes cx-auth-counter {
          from { transform: translate(-50%, calc(-1 * var(--orbit))) rotateZ(0deg); }
          to { transform: translate(-50%, calc(-1 * var(--orbit))) rotateZ(-360deg); }
        }
        @keyframes cx-auth-ring-tilt-a {
          from { transform: rotateX(72deg) rotateZ(0deg); }
          to { transform: rotateX(72deg) rotateZ(360deg); }
        }
        @keyframes cx-auth-ring-tilt-b {
          from { transform: rotateX(66deg) rotateY(10deg) rotateZ(0deg); }
          to { transform: rotateX(66deg) rotateY(10deg) rotateZ(-360deg); }
        }
        @keyframes cx-auth-shadow {
          0%   { opacity: 0.5; transform: scaleX(1) translateX(0); }
          25%  { opacity: 0.4; transform: scaleX(0.9) translateX(6px); }
          50%  { opacity: 0.35; transform: scaleX(0.8) translateX(0); }
          75%  { opacity: 0.4; transform: scaleX(0.9) translateX(-6px); }
          100% { opacity: 0.5; transform: scaleX(1) translateX(0); }
        }
        @keyframes cx-auth-glow-a {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.85; }
          50% { transform: translate(8%, 6%) scale(1.1); opacity: 1; }
        }
        @keyframes cx-auth-glow-b {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          50% { transform: translate(-10%, -5%) scale(1.12); opacity: 0.95; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cx-auth-logo__spin,
          .cx-auth-logo__mark-wrap,
          .cx-auth-logo__ring--outer,
          .cx-auth-logo__ring--inner,
          .cx-auth-logo__shadow,
          .cx-auth-logo__glow--a,
          .cx-auth-logo__glow--b {
            animation: none !important;
          }
          .cx-auth-logo__spin {
            transform: none;
          }
          .cx-auth-logo__mark-wrap {
            transform: translate(-50%, -50%);
            left: 50%;
            top: 50%;
          }
        }
      `}</style>
    </div>
  );
}

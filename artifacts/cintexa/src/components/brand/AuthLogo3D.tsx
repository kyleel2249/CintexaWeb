/**
 * CINTEXA mark for the auth card — CSS 3D stage with entrance tumble,
 * float, dual orbit rings, breathing shadow, and drifting gold glows.
 * Honors prefers-reduced-motion.
 */
export function AuthLogo3D({ size = 72 }: { size?: number }) {
  return (
    <div className="cx-auth-logo" style={{ ["--logo-size" as string]: `${size}px` }} aria-hidden>
      <div className="cx-auth-logo__stage">
        <div className="cx-auth-logo__glow cx-auth-logo__glow--a" />
        <div className="cx-auth-logo__glow cx-auth-logo__glow--b" />
        <div className="cx-auth-logo__ring cx-auth-logo__ring--outer" />
        <div className="cx-auth-logo__ring cx-auth-logo__ring--inner" />
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
        <div className="cx-auth-logo__shadow" />
      </div>
      <style>{`
        .cx-auth-logo {
          --logo-size: 72px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: calc(var(--logo-size) * 1.85);
          margin: 0 auto;
        }
        .cx-auth-logo__stage {
          position: relative;
          width: calc(var(--logo-size) * 1.7);
          height: calc(var(--logo-size) * 1.7);
          perspective: 1200px;
          transform-style: preserve-3d;
        }
        .cx-auth-logo__mark-wrap {
          position: absolute;
          inset: 50% auto auto 50%;
          width: var(--logo-size);
          height: var(--logo-size);
          margin: calc(var(--logo-size) / -2) 0 0 calc(var(--logo-size) / -2);
          transform-style: preserve-3d;
          animation:
            cx-auth-entrance 1.1s cubic-bezier(0.16, 1, 0.3, 1) both,
            cx-auth-float 4.5s ease-in-out 1.1s infinite;
          z-index: 3;
        }
        .cx-auth-logo__mark {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 22%;
          box-shadow:
            0 8px 28px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(245, 197, 24, 0.25);
        }
        .cx-auth-logo__ring {
          position: absolute;
          inset: 50% auto auto 50%;
          border-radius: 50%;
          border: 1.5px solid rgba(245, 197, 24, 0.45);
          transform-style: preserve-3d;
          pointer-events: none;
          z-index: 2;
        }
        .cx-auth-logo__ring--outer {
          width: calc(var(--logo-size) * 1.45);
          height: calc(var(--logo-size) * 1.45);
          margin: calc(var(--logo-size) * -0.725) 0 0 calc(var(--logo-size) * -0.725);
          animation: cx-auth-orbit-a 10s linear infinite;
          border-color: rgba(245, 197, 24, 0.4);
          box-shadow: 0 0 18px rgba(245, 197, 24, 0.12);
        }
        .cx-auth-logo__ring--inner {
          width: calc(var(--logo-size) * 1.15);
          height: calc(var(--logo-size) * 1.15);
          margin: calc(var(--logo-size) * -0.575) 0 0 calc(var(--logo-size) * -0.575);
          animation: cx-auth-orbit-b 7s linear infinite;
          border-color: rgba(245, 197, 24, 0.28);
          border-style: dashed;
        }
        .cx-auth-logo__shadow {
          position: absolute;
          left: 50%;
          bottom: 6%;
          width: calc(var(--logo-size) * 0.85);
          height: 10px;
          margin-left: calc(var(--logo-size) * -0.425);
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.55) 0%, transparent 70%);
          filter: blur(4px);
          animation: cx-auth-shadow 4.5s ease-in-out 1.1s infinite;
          z-index: 1;
        }
        .cx-auth-logo__glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(18px);
        }
        .cx-auth-logo__glow--a {
          width: 70%;
          height: 70%;
          top: 5%;
          left: 5%;
          background: radial-gradient(circle, rgba(245, 197, 24, 0.35) 0%, transparent 70%);
          animation: cx-auth-glow-a 6s ease-in-out infinite;
        }
        .cx-auth-logo__glow--b {
          width: 55%;
          height: 55%;
          bottom: 8%;
          right: 4%;
          background: radial-gradient(circle, rgba(245, 197, 24, 0.22) 0%, transparent 70%);
          animation: cx-auth-glow-b 7.5s ease-in-out infinite;
        }
        @keyframes cx-auth-entrance {
          0% {
            opacity: 0;
            transform: rotateX(48deg) rotateY(-36deg) rotateZ(18deg) scale(0.35);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
          }
        }
        @keyframes cx-auth-float {
          0%, 100% { transform: translateY(0) rotateX(4deg) rotateY(-3deg); }
          50% { transform: translateY(-7px) rotateX(-3deg) rotateY(4deg); }
        }
        @keyframes cx-auth-orbit-a {
          from { transform: rotateX(68deg) rotateZ(0deg); }
          to { transform: rotateX(68deg) rotateZ(360deg); }
        }
        @keyframes cx-auth-orbit-b {
          from { transform: rotateX(62deg) rotateY(12deg) rotateZ(0deg); }
          to { transform: rotateX(62deg) rotateY(12deg) rotateZ(-360deg); }
        }
        @keyframes cx-auth-shadow {
          0%, 100% { opacity: 0.55; transform: scaleX(1); }
          50% { opacity: 0.35; transform: scaleX(0.82); }
        }
        @keyframes cx-auth-glow-a {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.85; }
          50% { transform: translate(10%, 8%) scale(1.12); opacity: 1; }
        }
        @keyframes cx-auth-glow-b {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          50% { transform: translate(-12%, -6%) scale(1.15); opacity: 0.95; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cx-auth-logo__mark-wrap,
          .cx-auth-logo__ring--outer,
          .cx-auth-logo__ring--inner,
          .cx-auth-logo__shadow,
          .cx-auth-logo__glow--a,
          .cx-auth-logo__glow--b {
            animation: none !important;
          }
          .cx-auth-logo__mark-wrap {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

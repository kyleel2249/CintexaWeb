import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { AuthLogo3D } from "@/components/brand/AuthLogo3D";

function goToDashboard() {
  window.location.assign("/dashboard");
}

/**
 * Compact, centered CINTEXA auth card — create account or log in.
 */
export function GetStarted() {
  const { signIn, signUp, isSignedIn, isLoaded } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn) goToDashboard();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="cx-auth-page">
        <div className="cx-auth-card text-center">
          <AuthLogo3D size={36} />
          <p className="cx-eyebrow mt-4">CINTEXA</p>
          <h1 className="cx-display mt-2 text-xl">
            {isSignedIn ? "Taking you to your dashboard…" : "Loading…"}
          </h1>
          {isSignedIn && (
            <a href="/dashboard" className="cx-btn cx-btn-primary mt-6 inline-flex">
              Continue to dashboard
            </a>
          )}
        </div>
        <AuthPageStyles />
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("working");
    setMessage("");
    if (mode === "login") {
      const result = await signIn(email.trim(), password);
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      goToDashboard();
      return;
    }
    const result = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
    });
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    goToDashboard();
  }

  return (
    <div className="cx-auth-page">
      <div className="cx-auth-card">
        <Link
          href="/"
          className="mb-1 inline-flex text-xs text-[hsl(var(--fg-muted))] transition hover:text-[hsl(var(--fg))]"
        >
          ← Back to home
        </Link>

        <AuthLogo3D size={36} />

        <p className="cx-eyebrow mt-1 text-center">CINTEXA account</p>
        <h1 className="cx-display mt-1 text-center text-xl sm:text-2xl">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>
        <p className="mt-1.5 text-center text-xs text-[hsl(var(--fg-muted))]">
          {mode === "login"
            ? "Access your dashboard and growth tools."
            : "Join CINTEXA — then open your customer portal."}
        </p>

        <div className="mt-4 flex gap-1.5">
          <button
            type="button"
            className={`cx-btn cx-btn-sm flex-1 ${mode === "signup" ? "cx-btn-primary" : "cx-btn-secondary"}`}
            onClick={() => {
              setMode("signup");
              setStatus("idle");
              setMessage("");
            }}
          >
            Sign up
          </button>
          <button
            type="button"
            className={`cx-btn cx-btn-sm flex-1 ${mode === "login" ? "cx-btn-primary" : "cx-btn-secondary"}`}
            onClick={() => {
              setMode("login");
              setStatus("idle");
              setMessage("");
            }}
          >
            Log in
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2.5">
          {mode === "signup" && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Full name *</span>
              <input
                className="cx-input cx-input--sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-[hsl(var(--fg-muted))]">Email *</span>
            <input
              type="email"
              className="cx-input cx-input--sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-[hsl(var(--fg-muted))]">Password *</span>
            <input
              type="password"
              className="cx-input cx-input--sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>
          {mode === "signup" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[hsl(var(--fg-muted))]">Phone / WhatsApp</span>
                <input
                  type="tel"
                  className="cx-input cx-input--sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[hsl(var(--fg-muted))]">Company</span>
                  <input
                    className="cx-input cx-input--sm"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="organization"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[hsl(var(--fg-muted))]">Role</span>
                  <input
                    className="cx-input cx-input--sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    autoComplete="organization-title"
                  />
                </label>
              </div>
            </>
          )}
          {status === "error" && (
            <p className="text-xs text-red-400" role="alert">
              {message}
            </p>
          )}
          <button
            type="submit"
            className="cx-btn cx-btn-primary mt-1 w-full"
            disabled={status === "working"}
          >
            {status === "working"
              ? "Please wait…"
              : mode === "login"
                ? "Log in to dashboard"
                : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-[hsl(var(--fg-muted))]">
          <Link href="/pricing" className="underline underline-offset-2 hover:text-[hsl(var(--fg))]">
            Pricing
          </Link>
          <span className="mx-1.5 opacity-40">·</span>
          <Link href="/contact" className="underline underline-offset-2 hover:text-[hsl(var(--fg))]">
            Contact
          </Link>
          <span className="mx-1.5 opacity-40">·</span>
          <Link href="/platform" className="underline underline-offset-2 hover:text-[hsl(var(--fg))]">
            Platform
          </Link>
        </p>
      </div>
      <AuthPageStyles />
    </div>
  );
}

function AuthPageStyles() {
  return (
    <style>{`
      .cx-auth-page {
        min-height: calc(100vh - 8rem);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem 1rem 2.5rem;
      }
      .cx-auth-card {
        width: 100%;
        max-width: 360px;
        padding: 1.25rem 1.35rem 1.5rem;
        border-radius: 1rem;
        border: 1px solid hsl(var(--border));
        background: hsl(var(--bg-elevated) / 0.92);
        box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(12px);
      }
      .cx-input--sm {
        padding-top: 0.45rem;
        padding-bottom: 0.45rem;
        font-size: 0.875rem;
      }
    `}</style>
  );
}

export default GetStarted;

import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

function goToDashboard() {
  // Full navigation so dashboard always loads a fresh authenticated shell
  window.location.assign("/dashboard");
}

/**
 * CINTEXA authentication — create account or log in.
 * Successful signup / login always redirects to the customer dashboard.
 */
export function GetStarted() {
  const { signIn, signUp, isSignedIn, isLoaded, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");

  // Already signed in → dashboard immediately
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      goToDashboard();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || isSignedIn) {
    return (
      <section className="cx-section">
        <div className="cx-container max-w-md text-center">
          <p className="cx-eyebrow">CINTEXA</p>
          <h1 className="cx-display mt-2 text-2xl">
            {isSignedIn ? "Taking you to your dashboard…" : "Loading…"}
          </h1>
          {isSignedIn && (
            <a href="/dashboard" className="cx-btn cx-btn-primary mt-8 inline-flex">
              Continue to dashboard
            </a>
          )}
        </div>
      </section>
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
    <section className="cx-section">
      <div className="cx-container max-w-md">
        <p className="cx-eyebrow">CINTEXA account</p>
        <h1 className="cx-display mt-2 text-3xl sm:text-4xl">
          {mode === "login" ? "Log in" : "Create your account"}
        </h1>
        <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
          {mode === "login"
            ? "Access your dashboard, progress, and growth tools."
            : "Join CINTEXA to track growth, contributions, and your customer portal."}
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className={`cx-btn cx-btn-sm flex-1 ${mode === "signup" ? "cx-btn-primary" : "cx-btn-secondary"}`}
            onClick={() => {
              setMode("signup");
              setStatus("idle");
              setMessage("");
            }}
          >
            Create account
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

        <form onSubmit={onSubmit} className="cx-card mt-6 flex flex-col gap-4 p-6">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Full name *</span>
              <input
                className="cx-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[hsl(var(--fg-muted))]">Email *</span>
            <input
              type="email"
              className="cx-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[hsl(var(--fg-muted))]">Password *</span>
            <input
              type="password"
              className="cx-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
            {mode === "signup" && (
              <span className="text-[10px] text-[hsl(var(--fg-muted))]">At least 8 characters</span>
            )}
          </label>
          {mode === "signup" && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[hsl(var(--fg-muted))]">Phone / WhatsApp</span>
                <input
                  type="tel"
                  className="cx-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[hsl(var(--fg-muted))]">Company</span>
                <input
                  className="cx-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[hsl(var(--fg-muted))]">Role</span>
                <input
                  className="cx-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  autoComplete="organization-title"
                />
              </label>
            </>
          )}
          {status === "error" && (
            <p className="text-sm text-red-400" role="alert">
              {message}
            </p>
          )}
          <button type="submit" className="cx-btn cx-btn-primary w-full" disabled={status === "working"}>
            {status === "working"
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[hsl(var(--fg-muted))]">
          Looking for plans?{" "}
          <Link href="/pricing" className="underline underline-offset-2 hover:text-[hsl(var(--fg))]">
            See pricing
          </Link>
        </p>
      </div>
    </section>
  );
}

export default GetStarted;

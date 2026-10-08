import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useAuth, requestPasswordReset, resetPasswordWithCode } from "@/lib/auth";
import { AuthLogo3D } from "@/components/brand/AuthLogo3D";

const LAST_EMAIL_KEY = "cintexa_last_email";

function goToDashboard() {
  window.location.assign("/dashboard");
}

function rememberEmail(email: string) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* private mode */
  }
}

function readRememberedEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

type Mode = "login" | "signup" | "forgot" | "reset";

/**
 * CINTEXA auth card — sign up, log in, and password recovery (email + SMS code).
 */
export function GetStarted() {
  const { signIn, signUp, isSignedIn, isLoaded } = useAuth();
  const remembered = readRememberedEmail();
  const [mode, setMode] = useState<Mode>(remembered ? "login" : "signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<{ email: boolean; sms: boolean } | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) goToDashboard();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (mode === "login") {
      const saved = readRememberedEmail();
      if (saved && !email) setEmail(saved);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("working");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const loginEmail = String(fd.get("username") || email).trim();
    const loginPassword = String(fd.get("password") || password);
    const result = await signIn(loginEmail, loginPassword);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    rememberEmail(loginEmail);
    goToDashboard();
  }

  async function onSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("working");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const signupEmail = String(fd.get("email") || email).trim();
    const signupPassword = String(fd.get("password") || password);
    const signupName = String(fd.get("name") || fullName).trim();
    const result = await signUp({
      fullName: signupName,
      email: signupEmail,
      password: signupPassword,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
    });
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    rememberEmail(signupEmail);
    goToDashboard();
  }

  async function onForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("working");
    setMessage("");
    setChannels(null);
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setChannels(result.channels ?? null);
    setStatus("success");
    setMessage(result.message);
    setMode("reset");
  }

  async function onReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("working");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    const result = await resetPasswordWithCode(email, code, newPassword);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setStatus("success");
    setMessage(result.message);
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCode("");
    rememberEmail(email);
    setTimeout(() => {
      setMode("login");
      setStatus("idle");
      setMessage("Password updated. Log in with your new password.");
    }, 800);
  }

  const title =
    mode === "login"
      ? "Log in"
      : mode === "signup"
        ? "Create account"
        : mode === "forgot"
          ? "Forgot password"
          : "Reset password";

  const subtitle =
    mode === "login"
      ? "Use your saved email and password."
      : mode === "signup"
        ? "Join CINTEXA — then open your customer portal."
        : mode === "forgot"
          ? "We will send a 6-digit code by email and SMS (if a phone is on your account)."
          : "Enter the code from email or SMS, then choose a new password.";

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
        <h1 className="cx-display mt-1 text-center text-xl sm:text-2xl">{title}</h1>
        <p className="mt-1.5 text-center text-xs text-[hsl(var(--fg-muted))]">{subtitle}</p>

        {(mode === "login" || mode === "signup") && (
          <div className="mt-4 flex gap-1.5" role="tablist" aria-label="Account mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`cx-btn cx-btn-sm flex-1 ${mode === "signup" ? "cx-btn-primary" : "cx-btn-secondary"}`}
              onClick={() => {
                setMode("signup");
                setStatus("idle");
                setMessage("");
                setPassword("");
              }}
            >
              Sign up
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`cx-btn cx-btn-sm flex-1 ${mode === "login" ? "cx-btn-primary" : "cx-btn-secondary"}`}
              onClick={() => {
                setMode("login");
                setStatus("idle");
                setMessage("");
                setPassword("");
                const saved = readRememberedEmail();
                if (saved) setEmail(saved);
              }}
            >
              Log in
            </button>
          </div>
        )}

        {mode === "login" && (
          <form
            key="login-form"
            method="post"
            action="/get-started"
            autoComplete="on"
            onSubmit={onLogin}
            className="mt-4 flex flex-col gap-2.5"
          >
            <label className="flex flex-col gap-1" htmlFor="cintexa-login-email">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Email *</span>
              <input
                id="cintexa-login-email"
                name="username"
                type="email"
                inputMode="email"
                className="cx-input cx-input--sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="cintexa-login-password">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Password *</span>
              <input
                id="cintexa-login-password"
                name="password"
                type="password"
                className="cx-input cx-input--sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[11px] text-[hsl(var(--accent))] underline-offset-2 hover:underline"
                onClick={() => {
                  setMode("forgot");
                  setStatus("idle");
                  setMessage("");
                  setPassword("");
                }}
              >
                Forgot password?
              </button>
            </div>
            {(status === "error" || (status === "idle" && message)) && (
              <p className={`text-xs ${status === "error" ? "text-red-400" : "text-[hsl(var(--fg-muted))]"}`} role="alert">
                {message}
              </p>
            )}
            <button type="submit" className="cx-btn cx-btn-primary mt-1 w-full" disabled={status === "working"}>
              {status === "working" ? "Please wait…" : "Log in to dashboard"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form
            key="signup-form"
            method="post"
            action="/get-started"
            autoComplete="on"
            onSubmit={onSignup}
            className="mt-4 flex flex-col gap-2.5"
          >
            <label className="flex flex-col gap-1" htmlFor="cintexa-signup-name">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Full name *</span>
              <input
                id="cintexa-signup-name"
                name="name"
                type="text"
                className="cx-input cx-input--sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="cintexa-signup-email">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Email *</span>
              <input
                id="cintexa-signup-email"
                name="email"
                type="email"
                inputMode="email"
                className="cx-input cx-input--sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                required
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="cintexa-signup-password">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Password *</span>
              <input
                id="cintexa-signup-password"
                name="password"
                type="password"
                className="cx-input cx-input--sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="cintexa-signup-phone">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Phone / WhatsApp (for SMS recovery)</span>
              <input
                id="cintexa-signup-phone"
                name="tel"
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
                  name="organization"
                  className="cx-input cx-input--sm"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[hsl(var(--fg-muted))]">Role</span>
                <input
                  name="organization-title"
                  className="cx-input cx-input--sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  autoComplete="organization-title"
                />
              </label>
            </div>
            {status === "error" && (
              <p className="text-xs text-red-400" role="alert">
                {message}
              </p>
            )}
            <button type="submit" className="cx-btn cx-btn-primary mt-1 w-full" disabled={status === "working"}>
              {status === "working" ? "Please wait…" : "Create account"}
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={onForgot} className="mt-4 flex flex-col gap-2.5" autoComplete="on">
            <label className="flex flex-col gap-1" htmlFor="cintexa-forgot-email">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Account email *</span>
              <input
                id="cintexa-forgot-email"
                type="email"
                className="cx-input cx-input--sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <p className="text-[11px] text-[hsl(var(--fg-muted))]">
              A 6-digit code will be sent to your email and, if your account has a phone number, by SMS.
            </p>
            {status === "error" && (
              <p className="text-xs text-red-400" role="alert">
                {message}
              </p>
            )}
            <button type="submit" className="cx-btn cx-btn-primary w-full" disabled={status === "working"}>
              {status === "working" ? "Sending code…" : "Send recovery code"}
            </button>
            <button
              type="button"
              className="text-center text-[11px] text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg))]"
              onClick={() => {
                setMode("login");
                setStatus("idle");
                setMessage("");
              }}
            >
              ← Back to log in
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={onReset} className="mt-4 flex flex-col gap-2.5" autoComplete="off">
            {(status === "success" || channels) && (
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg-inset)/0.5)] px-3 py-2 text-[11px] text-[hsl(var(--fg-muted))]">
                {message && <p className="mb-1">{message}</p>}
                {channels && (
                  <p>
                    Delivery:{" "}
                    {channels.email ? "Email sent" : "Email pending"}
                    {" · "}
                    {channels.sms ? "SMS sent" : "SMS not available"}
                  </p>
                )}
              </div>
            )}
            <label className="flex flex-col gap-1" htmlFor="cintexa-reset-code">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">6-digit code *</span>
              <input
                id="cintexa-reset-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="cx-input cx-input--sm tracking-[0.3em] font-mono text-center text-lg"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                required
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="cintexa-reset-password">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">New password *</span>
              <input
                id="cintexa-reset-password"
                type="password"
                className="cx-input cx-input--sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="cintexa-reset-confirm">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Confirm new password *</span>
              <input
                id="cintexa-reset-confirm"
                type="password"
                className="cx-input cx-input--sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            {status === "error" && (
              <p className="text-xs text-red-400" role="alert">
                {message}
              </p>
            )}
            <button type="submit" className="cx-btn cx-btn-primary w-full" disabled={status === "working"}>
              {status === "working" ? "Updating…" : "Update password"}
            </button>
            <button
              type="button"
              className="text-center text-[11px] text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg))]"
              onClick={() => {
                setMode("login");
                setStatus("idle");
                setMessage("");
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              ← Back to log in
            </button>
          </form>
        )}
      </div>
      <AuthPageStyles />
    </div>
  );
}

function AuthPageStyles() {
  return (
    <style>{`
      .cx-auth-page {
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: hsl(var(--bg));
      }
      .cx-auth-card {
        width: 100%;
        max-width: 400px;
        padding: 1.75rem 1.5rem;
        border-radius: 1rem;
        border: 1px solid hsl(var(--border));
        background: hsl(var(--bg-elevated));
        box-shadow: 0 8px 32px hsl(0 0% 0% / 0.35);
      }
    `}</style>
  );
}

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, requestPasswordReset, resetPasswordWithCode } from "@/lib/auth";
import { AuthLogo3D } from "@/components/brand/AuthLogo3D";
import {
  initialAuthMode,
  isValidPhone,
  readRememberedEmail,
  rememberEmail,
  safeNextPath,
  type AuthMode,
} from "@/lib/auth-flow";

function goTo(path: string) {
  window.location.assign(path);
}

type Status = "idle" | "working" | "error" | "success";

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  hint,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] text-[hsl(var(--fg-muted))]">
        {label} *
      </label>
      <div className="cx-auth-pw">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          className="cx-input cx-input--sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={128}
          aria-describedby={hint ? `${id}-hint` : undefined}
          required
        />
        <button
          type="button"
          className="cx-auth-pw__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint && (
        <span id={`${id}-hint`} className="text-[11px] text-[hsl(var(--fg-muted))]">
          {hint}
        </span>
      )}
    </div>
  );
}

/**
 * CINTEXA auth card — sign up, log in, and password recovery (email + SMS code).
 * Served at /get-started, /sign-in and /sign-up. Supports ?mode=login|signup and a
 * safe same-origin ?next=/path redirect after authentication.
 */
export function GetStarted() {
  const { signIn, signUp, isSignedIn, isLoaded } = useAuth();
  const [pathname] = useLocation();
  const [mode, setMode] = useState<AuthMode>(() =>
    initialAuthMode(pathname, window.location.search, readRememberedEmail()),
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => readRememberedEmail());
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<{ email: boolean; sms: boolean } | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const redirected = useRef(false);

  // Single redirect path after any successful sign-in / sign-up / existing session.
  useEffect(() => {
    if (isLoaded && isSignedIn && !redirected.current) {
      redirected.current = true;
      goTo(safeNextPath(window.location.search));
    }
  }, [isLoaded, isSignedIn]);

  // Move focus to the heading when the form changes so screen-reader and keyboard
  // users land on the new context (skipped on first paint).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [mode]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="cx-auth-page">
        <div className="cx-auth-card text-center" role="status" aria-live="polite">
          <AuthLogo3D size={36} />
          <p className="cx-eyebrow mt-4">CINTEXA</p>
          <h1 className="cx-display mt-2 text-xl">
            {isSignedIn ? "Taking you to your dashboard…" : "Loading…"}
          </h1>
          {isSignedIn && (
            <a href={safeNextPath(window.location.search)} className="cx-btn cx-btn-primary mt-6 inline-flex">
              Continue
            </a>
          )}
        </div>
        <AuthPageStyles />
      </div>
    );
  }

  function switchMode(next: AuthMode, opts: { keepMessage?: boolean } = {}) {
    setMode(next);
    setStatus("idle");
    if (!opts.keepMessage) setMessage("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    if (next === "login") {
      const saved = readRememberedEmail();
      if (saved && !email) setEmail(saved);
    }
    if (next !== "reset") setCode("");
  }

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const next: AuthMode = mode === "signup" ? "login" : "signup";
      switchMode(next);
      requestAnimationFrame(() => document.getElementById(`cx-tab-${next}`)?.focus());
    }
  }

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "working") return;
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
    // Redirect is handled once by the isSignedIn effect.
  }

  async function onSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "working") return;
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const signupEmail = String(fd.get("email") || email).trim();
    const signupPassword = String(fd.get("password") || password);
    const signupName = String(fd.get("name") || fullName).trim();

    if (signupName.length < 2) {
      setStatus("error");
      setMessage("Enter your full name.");
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setStatus("error");
      setMessage("Enter a valid phone number, for example +233 24 000 0000.");
      return;
    }
    setStatus("working");
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
  }

  async function onForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "working") return;
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
    setMode("reset");
    setStatus("success");
    setMessage(result.message);
  }

  async function onReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "working") return;
    setMessage("");
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    setStatus("working");
    const result = await resetPasswordWithCode(email, code, newPassword);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    rememberEmail(email);
    setChannels(null);
    switchMode("login", { keepMessage: true });
    setStatus("idle");
    setMessage("Password updated. Log in with your new password.");
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
          ? "We will send a 6-digit code by email, and by SMS if a phone number is on your account."
          : "Enter the code from your email or SMS, then choose a new password.";

  const errorBlock =
    message && (status === "error" || (status === "idle" && mode === "login")) ? (
      <p
        className={`text-xs ${status === "error" ? "text-red-400" : "text-[hsl(var(--fg-muted))]"}`}
        role={status === "error" ? "alert" : "status"}
      >
        {message}
      </p>
    ) : null;

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
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="cx-display mt-1 text-center text-xl outline-none sm:text-2xl"
        >
          {title}
        </h1>
        <p className="mt-1.5 text-center text-xs text-[hsl(var(--fg-muted))]">{subtitle}</p>

        {(mode === "login" || mode === "signup") && (
          <div className="mt-4 flex gap-1.5" role="tablist" aria-label="Account mode">
            <button
              id="cx-tab-signup"
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              aria-controls="cx-panel-signup"
              tabIndex={mode === "signup" ? 0 : -1}
              className={`cx-btn cx-btn-sm flex-1 ${mode === "signup" ? "cx-btn-primary" : "cx-btn-secondary"}`}
              onClick={() => switchMode("signup")}
              onKeyDown={onTabKeyDown}
            >
              Sign up
            </button>
            <button
              id="cx-tab-login"
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              aria-controls="cx-panel-login"
              tabIndex={mode === "login" ? 0 : -1}
              className={`cx-btn cx-btn-sm flex-1 ${mode === "login" ? "cx-btn-primary" : "cx-btn-secondary"}`}
              onClick={() => switchMode("login")}
              onKeyDown={onTabKeyDown}
            >
              Log in
            </button>
          </div>
        )}

        {mode === "login" && (
          <form
            key="login-form"
            id="cx-panel-login"
            role="tabpanel"
            aria-labelledby="cx-tab-login"
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
            <PasswordField
              id="cintexa-login-password"
              name="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[11px] text-[hsl(var(--accent))] underline-offset-2 hover:underline"
                onClick={() => switchMode("forgot")}
              >
                Forgot password?
              </button>
            </div>
            {errorBlock}
            <button type="submit" className="cx-btn cx-btn-primary mt-1 w-full" disabled={status === "working"}>
              {status === "working" ? "Please wait…" : "Log in"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form
            key="signup-form"
            id="cx-panel-signup"
            role="tabpanel"
            aria-labelledby="cx-tab-signup"
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
                maxLength={120}
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
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </label>
            <PasswordField
              id="cintexa-signup-password"
              name="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters."
            />
            <label className="flex flex-col gap-1" htmlFor="cintexa-signup-phone">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Phone / WhatsApp (for SMS recovery)</span>
              <input
                id="cintexa-signup-phone"
                name="tel"
                type="tel"
                inputMode="tel"
                className="cx-input cx-input--sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                maxLength={40}
              />
            </label>
            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              <label className="flex flex-col gap-1" htmlFor="cintexa-signup-company">
                <span className="text-[11px] text-[hsl(var(--fg-muted))]">Company</span>
                <input
                  id="cintexa-signup-company"
                  name="organization"
                  className="cx-input cx-input--sm"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                  maxLength={160}
                />
              </label>
              <label className="flex flex-col gap-1" htmlFor="cintexa-signup-role">
                <span className="text-[11px] text-[hsl(var(--fg-muted))]">Role</span>
                <input
                  id="cintexa-signup-role"
                  name="organization-title"
                  className="cx-input cx-input--sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  autoComplete="organization-title"
                  maxLength={80}
                />
              </label>
            </div>
            {status === "error" && message && (
              <p className="text-xs text-red-400" role="alert">
                {message}
              </p>
            )}
            <button type="submit" className="cx-btn cx-btn-primary mt-1 w-full" disabled={status === "working"}>
              {status === "working" ? "Please wait…" : "Create account"}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-[hsl(var(--fg-muted))]">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[hsl(var(--fg))]">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-[hsl(var(--fg))]">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={onForgot} className="mt-4 flex flex-col gap-2.5" autoComplete="on">
            <label className="flex flex-col gap-1" htmlFor="cintexa-forgot-email">
              <span className="text-[11px] text-[hsl(var(--fg-muted))]">Account email *</span>
              <input
                id="cintexa-forgot-email"
                type="email"
                inputMode="email"
                className="cx-input cx-input--sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </label>
            {status === "error" && message && (
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
              onClick={() => switchMode("login")}
            >
              ← Back to log in
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={onReset} className="mt-4 flex flex-col gap-2.5" autoComplete="off">
            {(status === "success" || channels) && message && (
              <div
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg-inset)/0.5)] px-3 py-2 text-[11px] text-[hsl(var(--fg-muted))]"
                role="status"
              >
                <p className={channels ? "mb-1" : ""}>{message}</p>
                {channels && (
                  <p>
                    Delivery: {channels.email ? "Email sent" : "Email pending"}
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
                className="cx-input cx-input--sm text-center font-mono text-lg tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                required
              />
            </label>
            <PasswordField
              id="cintexa-reset-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters."
            />
            <PasswordField
              id="cintexa-reset-confirm"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              minLength={8}
            />
            {status === "error" && message && (
              <p className="text-xs text-red-400" role="alert">
                {message}
              </p>
            )}
            <button type="submit" className="cx-btn cx-btn-primary w-full" disabled={status === "working"}>
              {status === "working" ? "Updating…" : "Update password"}
            </button>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <button
                type="button"
                className="text-[hsl(var(--accent))] underline-offset-2 hover:underline"
                onClick={() => switchMode("forgot")}
              >
                Didn’t get a code? Send again
              </button>
              <button
                type="button"
                className="text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg))]"
                onClick={() => switchMode("login")}
              >
                ← Back to log in
              </button>
            </div>
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
        min-height: calc(100dvh - var(--nav-height, 4rem));
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem 1rem;
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
      @media (max-width: 380px) {
        .cx-auth-card { padding: 1.25rem 1rem; }
      }
      .cx-auth-card .cx-input { width: 100%; min-width: 0; }
      .cx-auth-card .cx-input--sm { padding: 0.55rem 0.75rem; font-size: 0.875rem; }
      .cx-auth-card .cx-input:focus-visible,
      .cx-auth-card button:focus-visible,
      .cx-auth-card a:focus-visible {
        outline: 2px solid hsl(var(--accent));
        outline-offset: 2px;
      }
      .cx-auth-pw { position: relative; display: flex; }
      .cx-auth-pw .cx-input { padding-right: 3.5rem; }
      .cx-auth-pw__toggle {
        position: absolute;
        right: 0.25rem;
        top: 50%;
        transform: translateY(-50%);
        padding: 0.3rem 0.55rem;
        border-radius: 0.5rem;
        font-size: 0.6875rem;
        font-weight: 600;
        color: hsl(var(--fg-muted));
      }
      .cx-auth-pw__toggle:hover { color: hsl(var(--fg)); }
    `}</style>
  );
}

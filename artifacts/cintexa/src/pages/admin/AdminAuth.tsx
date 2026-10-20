import { useState, type FormEvent, type ReactNode } from "react";
import { AdminApiError, adminRequest, setAdminToken } from "@/lib/admin-client";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="cx-section">
      <div className="cx-container max-w-md">
        <p className="cx-eyebrow">CINTEXA admin</p>
        <h1 className="cx-display mt-2 text-2xl sm:text-3xl">{title}</h1>
        <div className="cx-card mt-6">{children}</div>
      </div>
    </div>
  );
}

const field = "cx-input mt-1 w-full";
const label = "text-xs font-medium text-[hsl(var(--fg-muted))]";

const message = (e: unknown) => (e instanceof AdminApiError ? e.message : "Something went wrong. Please try again.");

/** Username + password. */
export function AdminSignIn({ setupNeeded, onSignedIn, initialNotice = "" }: { setupNeeded: boolean; onSignedIn: (username: string) => void; initialNotice?: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initialNotice);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await adminRequest<{ token: string; username: string }>("login", { method: "POST", body: { username, password }, auth: false });
      setAdminToken(res.token);
      setPassword("");
      onSignedIn(res.username);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function sendLink(kind: "reset-request" | "setup-request") {
    if (busy) return;
    setError("");
    setNotice("");
    if (kind === "reset-request" && !username.trim()) {
      setError("Enter your username first.");
      return;
    }
    setBusy(true);
    try {
      const res = await adminRequest<{ message?: string; sentTo?: string }>(kind, {
        method: "POST",
        body: kind === "reset-request" ? { username } : {},
        auth: false,
      });
      setNotice(
        res.message ??
          (kind === "reset-request"
            ? "If this accounts exists a password reset link has been sent."
            : `A one-time link was sent to ${res.sentTo ?? "info@cintexa.com"}.`),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Sign in">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className={label}>Username</span>
          <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={32} required />
        </label>
        <label className="block">
          <span className={label}>Password</span>
          <input type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={256} required />
        </label>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm" style={{ color: "hsl(var(--accent))" }} role="status">
            {notice}
          </p>
        )}
        <button type="submit" className="cx-btn cx-btn-primary w-full" disabled={busy}>
          {busy ? "Please wait…" : "Sign in"}
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <button type="button" className="text-left text-[hsl(var(--accent))] underline-offset-2 hover:underline" onClick={() => void sendLink("reset-request")}>
          Forgot password?
        </button>
        {setupNeeded && (
          <button type="button" className="text-left text-[hsl(var(--accent))] underline-offset-2 hover:underline" onClick={() => void sendLink("setup-request")}>
            First time? Send the setup link to info@cintexa.com
          </button>
        )}
      </div>
    </Card>
  );
}

function PasswordPair({ password, setPassword, confirm, setConfirm }: { password: string; setPassword: (v: string) => void; confirm: string; setConfirm: (v: string) => void }) {
  return (
    <>
      <label className="block">
        <span className={label}>Password</span>
        <input type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={128} required />
      </label>
      <label className="block">
        <span className={label}>Confirm password</span>
        <input type="password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={128} required />
      </label>
    </>
  );
}

/** Opened from the one-time link e-mailed to the CINTEXA inbox. */
export function AdminSetup({ token, onDone }: { token: string; onDone: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setError("The passwords don’t match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await adminRequest<{ token: string; username: string }>("setup", { method: "POST", body: { token, username, password }, auth: false });
      setAdminToken(res.token);
      onDone(res.username);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Create admin account">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className={label}>Username</span>
          <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={32} required />
        </label>
        <PasswordPair password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="cx-btn cx-btn-primary w-full" disabled={busy}>
          {busy ? "Creating…" : "Create admin account"}
        </button>
      </form>
    </Card>
  );
}

/** Opened from the one-time reset link. */
export function AdminReset({ token, onDone }: { token: string; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setError("The passwords don’t match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminRequest("reset", { method: "POST", body: { token, password }, auth: false });
      onDone();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Choose a new password">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <PasswordPair password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="cx-btn cx-btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </Card>
  );
}

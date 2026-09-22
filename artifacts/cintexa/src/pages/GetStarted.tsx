import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { submitGetStartedSignup } from "@/lib/email-notifications";

const hasClerk =
  typeof import.meta.env.VITE_CLERK_PUBLISHABLE_KEY === "string" &&
  Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.trim());

const embeddedAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    rootBox: "w-full",
    card: "bg-[hsl(var(--bg-raised))] border border-[hsl(var(--border))] shadow-none",
  },
} as const;

/**
 * Get Started — capture lead details (KV + info@cintexa.com) then Clerk auth.
 */
export function GetStarted() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [notifyMsg, setNotifyMsg] = useState("");

  async function onLeadSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setNotifyStatus("error");
      setNotifyMsg("Name and email are required.");
      return;
    }
    setNotifyStatus("saving");
    try {
      const result = await submitGetStartedSignup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim(),
        role: role.trim(),
        source: "get_started",
      });
      if (!result.ok) {
        // Still open mailto so info@ always has a path to receive the lead
        const subject = encodeURIComponent(`Get Started signup — ${fullName.trim()}`);
        const body = encodeURIComponent(
          [
            `Name: ${fullName.trim()}`,
            `Email: ${email.trim()}`,
            `Phone: ${phone || "—"}`,
            `Company: ${company || "—"}`,
            `Role: ${role || "—"}`,
          ].join("\n"),
        );
        window.open(`mailto:info@cintexa.com?subject=${subject}&body=${body}`, "_blank");
        setNotifyStatus("done");
        setNotifyMsg("Details saved. If email delivery is offline, your mail client may open as backup.");
        return;
      }
      const dry = result.adminNotify?.dryRun;
      setNotifyStatus("done");
      setNotifyMsg(
        dry
          ? "Details saved on CINTEXA. Admin email is in dry-run mode until RESEND_API_KEY is configured."
          : "Details sent to CINTEXA. Check your inbox for a confirmation email.",
      );
    } catch {
      setNotifyStatus("error");
      setNotifyMsg("Something went wrong. Email info@cintexa.com directly.");
    }
  }

  return (
    <section className="cx-section">
      <div className="cx-container mx-auto max-w-lg">
        <p className="cx-eyebrow text-center">Get started</p>
        <h1 className="cx-display mt-3 text-center text-3xl sm:text-4xl">
          {mode === "sign-up" ? "Get Started with CINTEXA — Create Your Account" : "Sign in to CINTEXA"}
        </h1>
        <p className="mt-3 text-center text-sm text-[hsl(var(--fg-muted))]">
          Access your dashboard, contributions, progress, and platform tools.
        </p>

        {mode === "sign-up" && (
          <form className="cx-card mt-8 space-y-3 p-5" onSubmit={onLeadSubmit}>
            <p className="cx-eyebrow">Your details</p>
            <p className="text-xs text-[hsl(var(--fg-muted))]">
              We store this securely and notify <strong>info@cintexa.com</strong> so our team can support you.
            </p>
            <label className="block">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Full name *</span>
              <input
                className="cx-input mt-1 w-full"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Email *</span>
              <input
                type="email"
                className="cx-input mt-1 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Phone / WhatsApp</span>
              <input
                type="tel"
                className="cx-input mt-1 w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Company / organisation</span>
              <input
                className="cx-input mt-1 w-full"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Role</span>
              <input
                className="cx-input mt-1 w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Founder, Marketing lead"
              />
            </label>
            {notifyStatus === "error" && (
              <p className="text-sm text-red-400">{notifyMsg}</p>
            )}
            {notifyStatus === "done" && (
              <p className="text-sm" style={{ color: "hsl(var(--accent))" }}>
                {notifyMsg}
              </p>
            )}
            <button
              type="submit"
              className="cx-btn cx-btn-secondary w-full"
              disabled={notifyStatus === "saving"}
            >
              {notifyStatus === "saving" ? "Sending…" : "Send details to CINTEXA"}
            </button>
          </form>
        )}

        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            className={`cx-btn cx-btn-sm ${mode === "sign-up" ? "cx-btn-primary" : "cx-btn-secondary"}`}
            onClick={() => setMode("sign-up")}
          >
            Sign up
          </button>
          <button
            type="button"
            className={`cx-btn cx-btn-sm ${mode === "sign-in" ? "cx-btn-primary" : "cx-btn-secondary"}`}
            onClick={() => setMode("sign-in")}
          >
            Sign in
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          {hasClerk ? (
            mode === "sign-up" ? (
              <SignUp
                routing="hash"
                signInUrl="/get-started#sign-in"
                fallbackRedirectUrl="/dashboard"
                appearance={embeddedAppearance}
              />
            ) : (
              <SignIn
                routing="hash"
                signUpUrl="/get-started#sign-up"
                fallbackRedirectUrl="/dashboard"
                appearance={embeddedAppearance}
              />
            )
          ) : (
            <div className="cx-card w-full max-w-md p-6 text-center">
              <p className="text-sm text-[hsl(var(--fg-muted))]">
                {notifyStatus === "done"
                  ? "Your details were submitted. Account login will be available once authentication is fully configured."
                  : "Submit your details above. Full sign-in unlocks when Clerk is configured on this deployment."}
              </p>
              <Link href="/contact" className="cx-btn cx-btn-secondary mt-6 inline-flex">
                Contact us
              </Link>
            </div>
          )}
        </div>

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

import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { submitGetStartedSignup } from "@/lib/email-notifications";

/**
 * Get Started — capture lead details (KV + info@cintexa.com).
 * Clerk sign-in / sign-up widgets are not shown on this page.
 */
export function GetStarted() {
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
      setNotifyStatus("done");
      setNotifyMsg("Thanks — your details were sent to CINTEXA. We’ll follow up soon.");
      setFullName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setRole("");
    } catch {
      setNotifyStatus("error");
      setNotifyMsg("Something went wrong. Please try again or email info@cintexa.com.");
    }
  }

  return (
    <section className="cx-section">
      <div className="cx-container max-w-xl">
        <p className="cx-eyebrow">Get started</p>
        <h1 className="cx-display mt-2 text-3xl sm:text-4xl">Start growing with CINTEXA</h1>
        <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
          Share a few details and our team will reach out. No account widget required on this page.
        </p>

        {notifyStatus === "done" ? (
          <div className="cx-card mt-8 p-6 text-center">
            <p className="text-sm text-[hsl(var(--fg))]">{notifyMsg}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="cx-btn cx-btn-secondary">
                Contact us
              </Link>
              <Link href="/platform" className="cx-btn cx-btn-primary">
                Explore platform
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onLeadSubmit} className="cx-card mt-8 flex flex-col gap-4 p-6">
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
            {notifyStatus === "error" && (
              <p className="text-sm text-[hsl(var(--danger))]" role="alert">
                {notifyMsg}
              </p>
            )}
            <button
              type="submit"
              className="cx-btn cx-btn-primary w-full"
              disabled={notifyStatus === "saving"}
            >
              {notifyStatus === "saving" ? "Sending…" : "Send details to CINTEXA"}
            </button>
          </form>
        )}

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

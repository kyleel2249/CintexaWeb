import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { submitCareerAlert } from "@/lib/email-notifications";

const INTERESTS = [
  "Full-time roles",
  "Internships",
  "Scholarships",
  "Graduate programmes",
  "Remote opportunities",
  "Technology & engineering",
  "Sales & marketing",
  "Design & product",
] as const;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  interests: string[];
  message: string;
};

const empty: FormState = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  education: "",
  interests: [],
  message: "",
};

export function Careers() {
  const [form, setForm] = useState<FormState>(empty);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  function toggleInterest(label: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(label)
        ? f.interests.filter((x) => x !== label)
        : [...f.interests, label],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    const entry = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
      location: form.location,
      education: form.education,
      interests: form.interests,
      message: form.message,
      source: "careers_page",
    };
    try {
      const key = "cintexa_career_alerts";
      const prev = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
      localStorage.setItem(
        key,
        JSON.stringify([{ ...entry, submittedAt: new Date().toISOString() }, ...prev].slice(0, 50)),
      );

      const result = await submitCareerAlert(entry);
      if (!result.ok) {
        // Graceful fallback: open mailto so the team still receives the lead
        const subject = encodeURIComponent(`Career & Scholarship alert signup — ${entry.fullName}`);
        const body = encodeURIComponent(
          [
            `Name: ${entry.fullName}`,
            `Email: ${entry.email}`,
            `Phone: ${entry.phone || "—"}`,
            `Location: ${entry.location || "—"}`,
            `Education: ${entry.education || "—"}`,
            `Interests: ${entry.interests.join(", ") || "—"}`,
            "",
            entry.message || "",
          ].join("\n"),
        );
        window.open(`mailto:info@cintexa.com?subject=${subject}&body=${body}`, "_blank");
      }
      setStatus("done");
      setForm(empty);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="cx-eyebrow">Careers · Scholarships</p>
        <h1 className="cx-display mt-3 max-w-2xl text-3xl sm:text-4xl">
          Build your future with CINTEXA
        </h1>
        <p className="mt-4 max-w-xl text-[hsl(var(--fg-muted))]">
          Sign up for job and scholarship alerts. When new roles or funding opportunities open, we
          email you so you can apply early.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="cx-card border-t-2 border-t-[hsl(var(--accent))]">
              <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>
                Jobs
              </p>
              <h2 className="cx-display mt-2 text-xl">Careers at and through CINTEXA</h2>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                Technology, product, sales, marketing, and operations roles—plus partner openings we
                share with our network. Create an account and complete your profile so recruiters
                can find you.
              </p>
              <Link href="/get-started" className="cx-btn cx-btn-primary cx-btn-sm mt-4">
                Sign up for jobs
              </Link>
            </div>
            <div className="cx-card">
              <p className="cx-eyebrow">Scholarships</p>
              <h2 className="cx-display mt-2 text-xl">Education & skills support</h2>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                Scholarship and learning pathways for students and early-career professionals
                focused on technology, business, and digital skills. Register interest to hear
                about new programmes.
              </p>
              <Link href="/dashboard/careers" className="cx-btn cx-btn-secondary cx-btn-sm mt-4">
                View listings in dashboard
              </Link>
            </div>
          </div>

          <div className="cx-card">
            <p className="cx-eyebrow">Job & scholarship alerts</p>
            <h2 className="cx-display mt-2 text-xl">Get emailed about new opportunities</h2>
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
              Fill in your details. We use this only to notify you about relevant jobs and
              scholarships.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <label className="block">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Full name *</span>
                <input
                  className="cx-input mt-1 w-full"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Email *</span>
                <input
                  type="email"
                  className="cx-input mt-1 w-full"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Phone / WhatsApp</span>
                <input
                  type="tel"
                  className="cx-input mt-1 w-full"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  autoComplete="tel"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Location</span>
                <input
                  className="cx-input mt-1 w-full"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City, country"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Education / level</span>
                <input
                  className="cx-input mt-1 w-full"
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  placeholder="e.g. Undergraduate, Graduate, Self-taught"
                />
              </label>
              <fieldset>
                <legend className="text-xs font-medium text-[hsl(var(--fg-muted))]">Interests</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INTERESTS.map((label) => {
                    const on = form.interests.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleInterest(label)}
                        className="rounded-full border px-3 py-1 text-xs transition-colors"
                        style={{
                          borderColor: on ? "hsl(var(--accent))" : "hsl(var(--border))",
                          background: on ? "hsl(var(--accent) / 0.15)" : "transparent",
                          color: on ? "hsl(var(--fg))" : "hsl(var(--fg-muted))",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="block">
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Anything else?</span>
                <textarea
                  className="cx-input mt-1 w-full min-h-[88px]"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                />
              </label>

              {status === "error" && (
                <p className="text-sm text-red-400">Please enter your name and a valid email.</p>
              )}
              {status === "done" && (
                <p className="text-sm" style={{ color: "hsl(var(--accent))" }}>
                  You’re on the list. Check your email client if a message to info@cintexa.com opened.
                </p>
              )}

              <button
                type="submit"
                className="cx-btn cx-btn-primary w-full sm:w-auto"
                disabled={status === "saving"}
              >
                {status === "saving" ? "Saving…" : "Get job & scholarship emails"}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-10 text-xs text-[hsl(var(--fg-muted))]">
          Questions?{" "}
          <a href="mailto:info@cintexa.com" className="underline hover:text-[hsl(var(--fg))]">
            info@cintexa.com
          </a>{" "}
          ·{" "}
          <a href="https://wa.me/233242483082" className="underline hover:text-[hsl(var(--fg))]">
            WhatsApp +233 24 248 3082
          </a>
        </p>
      </div>
    </div>
  );
}

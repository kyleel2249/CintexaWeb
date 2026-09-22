import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { submitCareerAlert } from "@/lib/email-notifications";

const WHATSAPP_NUMBER = "233595168610";
const PHONE_DISPLAY = "+233 59 516 8610";
const PHONE_TEL = "+233595168610";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello, I am interested in the Cleaner job vacancy. Please share application details.",
)}`;

const INTERESTS = [
  "Full-time roles",
  "Internships",
  "Scholarships",
  "Graduate programmes",
  "Remote opportunities",
  "Technology & engineering",
  "Sales & marketing",
  "Design & product",
  "Facilities & cleaning",
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

  useEffect(() => {
    document.title =
      "Cleaner Job Vacancy in Ghana | Apply Now — Careers & Job Alerts";
    const desc =
      "Cleaner job vacancy in Ghana. Apply now — available and dedicated candidates welcome. Call or WhatsApp +233 59 516 8610. Sign up for job and scholarship alerts.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

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
        const subject = encodeURIComponent(`Career alert signup — ${entry.fullName}`);
        const body = encodeURIComponent(
          [
            `Name: ${entry.fullName}`,
            `Email: ${entry.email}`,
            `Phone: ${entry.phone || "—"}`,
            `Location: ${entry.location || "—"}`,
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
        <p className="cx-eyebrow">Careers · Jobs · Scholarships</p>
        <h1 className="cx-display mt-3 max-w-3xl text-3xl sm:text-4xl">
          Cleaner Job Vacancy in Ghana — Apply Now
        </h1>
        <p className="mt-4 max-w-2xl text-[hsl(var(--fg-muted))]">
          A reliable{" "}
          <strong className="text-[hsl(var(--fg))]">Cleaner</strong> is needed for a professional
          office environment. If you take pride in a hygienic workspace and you are available and
          dedicated, you are invited to apply today.
        </p>

        {/* Featured vacancy */}
        <article
          className="mt-10 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-raised))]"
          itemScope
          itemType="https://schema.org/JobPosting"
        >
          <meta itemProp="title" content="Cleaner" />
          <meta itemProp="employmentType" content="FULL_TIME" />
          <meta itemProp="hiringOrganization" content="Hiring partner" />
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="relative min-h-[280px] bg-[hsl(var(--bg))]">
              <img
                src="/careers/cleaner-job-vacancy.jpeg"
                alt="Cleaner job vacancy — professional cleaning staff in modern office"
                className="absolute inset-0 h-full w-full object-cover"
                itemProp="image"
              />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>
                Open role · Apply now
              </p>
              <h2 className="cx-display mt-2 text-2xl sm:text-3xl" itemProp="title">
                <Link href="/careers/cleaner" className="hover:underline">
                  Cleaner
                </Link>
              </h2>
              <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
                Title / Role: <strong className="text-[hsl(var(--fg))]">Cleaner</strong>
                {" · "}
                <Link href="/careers/cleaner" className="underline" style={{ color: "hsl(var(--accent))" }}>
                  Full details
                </Link>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--fg-muted))]" itemProp="description">
                Keep workspaces clean, safe, and welcoming. Daily cleaning of offices, meeting
                areas, restrooms, and common spaces; restocking supplies; and reporting maintenance
                needs. Ideal for someone who is{" "}
                <strong className="text-[hsl(var(--fg))]">available and dedicated</strong>,
                punctual, and proud of high standards.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[hsl(var(--fg-muted))]">
                <li>
                  <span style={{ color: "hsl(var(--accent))" }}>→</span> Role:{" "}
                  <strong className="text-[hsl(var(--fg))]">Cleaner</strong>
                </li>
                <li>
                  <span style={{ color: "hsl(var(--accent))" }}>→</span> Requirements: Available and
                  dedicated
                </li>
                <li>
                  <span style={{ color: "hsl(var(--accent))" }}>→</span> Location: Ghana (confirm at
                  interview)
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--fg))]">
                  Interested? Call or WhatsApp now
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
                  Call or message for application steps, location, and start date.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="cx-btn cx-btn-secondary cx-btn-sm"
                  >
                    Call {PHONE_DISPLAY}
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cx-btn cx-btn-primary cx-btn-sm"
                  >
                    WhatsApp {PHONE_DISPLAY}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="cx-card">
              <p className="cx-eyebrow">Why this role matters</p>
              <h2 className="cx-display mt-2 text-xl">A clean workplace supports every team</h2>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                Clean, well-kept offices help staff and visitors stay focused and comfortable. As a
                Cleaner you play a direct part in that standard every day.
              </p>
            </div>
            <div className="cx-card">
              <p className="cx-eyebrow">Scholarships & more jobs</p>
              <h2 className="cx-display mt-2 text-xl">Stay informed</h2>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                Sign up for alerts on new roles and scholarship programmes. For the Cleaner vacancy,
                calling or WhatsApping is the fastest way to apply.
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
              Leave your details for future openings. For the current Cleaner role, prefer call or
              WhatsApp.
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
                  You&apos;re on the list. For the Cleaner role, call or WhatsApp {PHONE_DISPLAY}.
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
          Cleaner job vacancy · Call{" "}
          <a href={`tel:${PHONE_TEL}`} className="underline hover:text-[hsl(var(--fg))]">
            {PHONE_DISPLAY}
          </a>{" "}
          ·{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-[hsl(var(--fg))]">
            WhatsApp the same number
          </a>{" "}
          · General enquiries{" "}
          <a href="mailto:info@cintexa.com" className="underline hover:text-[hsl(var(--fg))]">
            info@cintexa.com
          </a>
        </p>
      </div>
    </div>
  );
}

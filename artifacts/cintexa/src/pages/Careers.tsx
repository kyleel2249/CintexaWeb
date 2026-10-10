import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { submitCareerAlert } from "@/lib/email-notifications";
import { AdSenseInContent } from "@/components/ads/AdSenseSlot";
import { JobCard } from "@/components/careers/JobCard";
import { getOpenJobs } from "@/data/jobs";
import { careersListSeo } from "@/data/careers-seo";
import { applyPageSeo } from "@/lib/seo-dom";

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

  // Current vacancies, newest first. Title, description, preview image, Open Graph, Twitter card
  // and JSON-LD are all derived from this list, so they change whenever the vacancies do.
  const jobs = useMemo(() => getOpenJobs(), []);
  useEffect(() => applyPageSeo(careersListSeo(jobs)), [jobs]);

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
          Careers & Job Vacancies in Ghana — Apply Now
        </h1>
        {jobs.length === 0 && (
          <p className="mt-10 text-[hsl(var(--fg-muted))]">
            There are no open vacancies right now. Sign up below and we will email you when new roles are posted.
          </p>
        )}
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}

        {jobs.some((j) => j.slug === "cleaner") && (
          <p className="mt-4 max-w-2xl text-[hsl(var(--fg-muted))]">
            Reliable <strong className="text-[hsl(var(--fg))]">Cleaners</strong> are needed for{" "}
            <strong className="text-[hsl(var(--fg))]">homes, offices, churches</strong>, schools and other premises. If
            you take pride in clean, hygienic spaces and you are available and dedicated, you are invited to apply
            today.
          </p>
        )}

        <AdSenseInContent />

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {jobs.some((j) => j.slug === "cleaner") && (
            <div className="cx-card">
              <p className="cx-eyebrow">Why these roles matter</p>
              <h2 className="cx-display mt-2 text-xl">Clean spaces support homes and communities</h2>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                Clean, well-kept homes, offices, churches and public spaces help families, staff and
                visitors stay comfortable and focused. As Cleaners you set that standard every day,
                wherever the assignment is.
              </p>
            </div>
            )}
            <div className="cx-card">
              <p className="cx-eyebrow">Scholarships & more jobs</p>
              <h2 className="cx-display mt-2 text-xl">Stay informed</h2>
              <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
                Sign up for alerts on new roles and scholarship programmes. For listed vacancies,
                calling or WhatsApping the contact is the fastest way to apply.
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
              Leave your details for future openings. For current vacancies, calling or WhatsApping the
              listed contact is the fastest way to apply.
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
                  You&apos;re on the list. You will be notified of any updates via email as provided. Don&apos;t miss it.
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
          General enquiries{" "}
          <a href="mailto:info@cintexa.com" className="underline hover:text-[hsl(var(--fg))]">
            info@cintexa.com
          </a>
        </p>
      </div>
    </div>
  );
}

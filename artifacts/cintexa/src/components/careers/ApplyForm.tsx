import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import type { JobPosting } from "@/data/jobs";
import { submitApplication } from "@/lib/careers-api";
import { validateApplication, type FieldErrors } from "@/lib/careers-validation";

type Values = { fullName: string; email: string; phone: string; location: string; message: string; website: string };
const EMPTY: Values = { fullName: "", email: "", phone: "", location: "", message: "", website: "" };

/** Online application for one vacancy. */
export function ApplyForm({ job }: { job: JobPosting }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [reference, setReference] = useState("");

  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    const found = validateApplication(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus("sending");
    setServerError("");
    const result = await submitApplication({
      jobSlug: job.slug,
      fullName: values.fullName.trim(),
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
      location: values.location.trim() || undefined,
      message: values.message.trim() || undefined,
      website: values.website,
    });
    if (result.ok) {
      setReference(result.id);
      setStatus("sent");
      return;
    }
    setErrors(result.fieldErrors ?? {});
    setServerError(result.error);
    setStatus("error");
  }

  if (status === "sent") {
    return (
      <section className="cx-card" aria-labelledby="apply-title" id="apply">
        <h2 id="apply-title" className="cx-display text-lg">
          Application sent
        </h2>
        <p className="mt-2 text-sm" role="status">
          Thank you, {values.fullName.trim().split(/\s+/)[0]}. Your application for {job.role} has been received.
        </p>
        <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">Reference: {reference.slice(0, 8).toUpperCase()}</p>
      </section>
    );
  }

  const field = "cx-input mt-1 w-full";
  const label = "text-xs font-medium text-[hsl(var(--fg-muted))]";
  const err = (k: string) => (errors[k] ? "text-xs text-red-400 mt-1" : "hidden");

  return (
    <section className="cx-card" aria-labelledby="apply-title" id="apply">
      <h2 id="apply-title" className="cx-display text-lg">
        Apply online
      </h2>
      <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
        <label className="block">
          <span className={label}>Full name *</span>
          <input
            className={field}
            value={values.fullName}
            onChange={set("fullName")}
            autoComplete="name"
            maxLength={120}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby="apply-name-err"
          />
          <span id="apply-name-err" className={err("fullName")} role="alert">
            {errors.fullName}
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Email</span>
            <input
              type="email"
              className={field}
              value={values.email}
              onChange={set("email")}
              autoComplete="email"
              maxLength={254}
              aria-invalid={Boolean(errors.email)}
              aria-describedby="apply-email-err"
            />
            <span id="apply-email-err" className={err("email")} role="alert">
              {errors.email}
            </span>
          </label>
          <label className="block">
            <span className={label}>Phone / WhatsApp</span>
            <input
              type="tel"
              className={field}
              value={values.phone}
              onChange={set("phone")}
              autoComplete="tel"
              maxLength={40}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby="apply-phone-err"
            />
            <span id="apply-phone-err" className={err("phone")} role="alert">
              {errors.phone}
            </span>
          </label>
        </div>
        <label className="block">
          <span className={label}>Where do you live?</span>
          <input className={field} value={values.location} onChange={set("location")} maxLength={120} autoComplete="address-level2" />
        </label>
        <label className="block">
          <span className={label}>Why are you a good fit?</span>
          <textarea
            className={`${field} min-h-[96px]`}
            rows={4}
            value={values.message}
            onChange={set("message")}
            maxLength={1500}
            aria-invalid={Boolean(errors.message)}
            aria-describedby="apply-msg-err"
          />
          <span id="apply-msg-err" className={err("message")} role="alert">
            {errors.message}
          </span>
        </label>

        {/* Honeypot: invisible to people, tempting to bots. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
          </label>
        </div>

        {serverError && (
          <p className="text-sm text-red-400" role="alert">
            {serverError}
          </p>
        )}
        <button type="submit" className="cx-btn cx-btn-primary w-full sm:w-auto" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send application"}
        </button>
        <p className="text-xs text-[hsl(var(--fg-muted))]">
          By applying you agree to our{" "}
          <Link href="/privacy-policy" className="underline hover:text-[hsl(var(--fg))]">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </section>
  );
}

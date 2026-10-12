import { useState, type FormEvent } from "react";
import { submitCareerAlert } from "@/lib/email-notifications";
import { validateAlertSignup, type FieldErrors } from "@/lib/careers-validation";
import { ALERT_INTERESTS } from "@/data/alert-interests";


type Values = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  interests: string[];
  message: string;
  website: string;
};
const EMPTY: Values = { fullName: "", email: "", phone: "", location: "", interests: [], message: "", website: "" };

/**
 * Job & scholarship alert signup. Validates before sending, tells the truth about the result, and
 * keeps nothing about the person in the browser.
 */
export function JobAlertForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  function toggleInterest(label: string) {
    setValues((v) => ({
      ...v,
      interests: v.interests.includes(label) ? v.interests.filter((x) => x !== label) : [...v.interests, label],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "saving") return;
    const found = validateAlertSignup(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus("saving");
    setServerError("");
    try {
      const result = await submitCareerAlert({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        location: values.location.trim(),
        interests: values.interests,
        message: values.message.trim(),
        source: "careers_page",
        website: values.website,
      });
      if (!result.ok) {
        setServerError(result.error || "We couldn’t save your signup. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
      setValues(EMPTY);
    } catch {
      setServerError("We couldn’t reach CINTEXA. Check your connection and try again.");
      setStatus("error");
    }
  }

  const field = "cx-input mt-1 w-full";
  const label = "text-xs font-medium text-[hsl(var(--fg-muted))]";
  const err = (k: string) => (errors[k] ? "mt-1 text-xs text-red-400" : "hidden");

  return (
    <div className="cx-card">
      <p className="cx-eyebrow">Job & scholarship alerts</p>
      <h2 className="cx-display mt-2 text-xl">Get emailed about new opportunities</h2>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <label className="block">
          <span className={label}>Full name *</span>
          <input
            className={field}
            value={values.fullName}
            onChange={set("fullName")}
            autoComplete="name"
            maxLength={120}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby="alert-name-err"
          />
          <span id="alert-name-err" className={err("fullName")} role="alert">
            {errors.fullName}
          </span>
        </label>
        <label className="block">
          <span className={label}>Email *</span>
          <input
            type="email"
            className={field}
            value={values.email}
            onChange={set("email")}
            autoComplete="email"
            maxLength={254}
            aria-invalid={Boolean(errors.email)}
            aria-describedby="alert-email-err"
          />
          <span id="alert-email-err" className={err("email")} role="alert">
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
            aria-describedby="alert-phone-err"
          />
          <span id="alert-phone-err" className={err("phone")} role="alert">
            {errors.phone}
          </span>
        </label>
        <label className="block">
          <span className={label}>Location</span>
          <input className={field} value={values.location} onChange={set("location")} placeholder="City, country" maxLength={120} />
        </label>
        <fieldset>
          <legend className={label}>Interests</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALERT_INTERESTS.map((item) => {
              const on = values.interests.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleInterest(item)}
                  className="rounded-full border px-3 py-1 text-xs transition-colors"
                  style={{
                    borderColor: on ? "hsl(var(--accent))" : "hsl(var(--border))",
                    background: on ? "hsl(var(--accent) / 0.15)" : "transparent",
                    color: on ? "hsl(var(--fg))" : "hsl(var(--fg-muted))",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="block">
          <span className={label}>Anything else?</span>
          <textarea className={`${field} min-h-[88px]`} value={values.message} onChange={set("message")} rows={3} maxLength={2000} />
        </label>

        {/* Honeypot: invisible to people, tempting to bots. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
          </label>
        </div>

        {status === "error" && (
          <p className="text-sm text-red-400" role="alert">
            {serverError}{" "}
            <a className="underline" href="mailto:info@cintexa.com?subject=Career%20alert%20signup">
              Email us instead
            </a>
          </p>
        )}
        {status === "done" && (
          <p className="text-sm" style={{ color: "hsl(var(--accent))" }} role="status">
            You’re on the list. We’ll email you when new opportunities are posted.
          </p>
        )}
        <button type="submit" className="cx-btn cx-btn-primary w-full sm:w-auto" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Get job & scholarship emails"}
        </button>
      </form>
    </div>
  );
}

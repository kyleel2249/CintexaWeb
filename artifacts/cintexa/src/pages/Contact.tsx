import { useState, type FormEvent } from "react";
import { Link } from "wouter";

const EMAIL = "info@cintexa.com";
const PHONE_DISPLAY = "+233 24 248 3082";
const PHONE_TEL = "+233242483082";
const WHATSAPP = "https://wa.me/233242483082";

export function Contact() {
  const [sent, setSent] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(String(form.get("subject") || "CINTEXA website enquiry"));
    const body = encodeURIComponent(`Name: ${form.get("name")}\\nEmail: ${form.get("email")}\\nBusiness: ${form.get("business") || "Not provided"}\\n\\n${form.get("message")}`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }
  return (
    <div className="cx-section">
      <div className="cx-container max-w-2xl">
        <p className="cx-eyebrow">Contact</p>
        <h1 className="cx-display mt-3 text-3xl sm:text-4xl">Contact CINTEXA</h1>
        <p className="mt-4 text-[hsl(var(--fg-muted))]">
          Whether you need a custom website, software, growth technology, or a full platform conversation—reach us
          directly.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-1">
          <a
            href={`mailto:${EMAIL}`}
            className="cx-card cx-card-interactive block"
          >
            <p className="cx-eyebrow">Email</p>
            <p className="cx-display mt-2 text-xl">{EMAIL}</p>
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">We respond to project and partnership enquiries.</p>
          </a>

          <a href={`tel:${PHONE_TEL}`} className="cx-card cx-card-interactive block">
            <p className="cx-eyebrow">Call</p>
            <p className="cx-display mt-2 text-xl">{PHONE_DISPLAY}</p>
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Speak with the team about your requirements.</p>
          </a>

          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="cx-card cx-card-interactive block border-t-2 border-t-[hsl(var(--accent))]"
          >
            <p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>
              WhatsApp
            </p>
            <p className="cx-display mt-2 text-xl">{PHONE_DISPLAY}</p>
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Message us on WhatsApp for a fast response.</p>
          </a>
        </div>

        <section className="cx-card mt-8">\n          <h2 className="cx-display text-xl">Send a project enquiry</h2>\n          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Complete the form. It will prepare an email in your default mail application; no message is stored on this page.</p>\n          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">\n            <div className="grid gap-4 sm:grid-cols-2"><label className="cx-label">Your name<input className="cx-input mt-2 w-full" name="name" required autoComplete="name" /></label><label className="cx-label">Email address<input className="cx-input mt-2 w-full" type="email" name="email" required autoComplete="email" /></label></div>\n            <label className="cx-label">Business / organisation (optional)<input className="cx-input mt-2 w-full" name="business" autoComplete="organization" /></label>\n            <label className="cx-label">Subject<input className="cx-input mt-2 w-full" name="subject" required defaultValue="CINTEXA project enquiry" /></label>\n            <label className="cx-label">How can we help?<textarea className="cx-input mt-2 min-h-32 w-full" name="message" required /></label>\n            <button type="submit" className="cx-btn cx-btn-primary w-fit">Prepare enquiry email</button>\n            {sent && <p role="status" className="text-sm text-[hsl(var(--fg-muted))]">Your email application should open. If it does not, email info@cintexa.com directly.</p>}\n          </form>\n        </section>\n        <section className="mt-8"><h2 className="cx-display text-xl">Connect with CINTEXA</h2><div className="mt-3 flex flex-wrap gap-3"><a className="cx-btn cx-btn-secondary" href="https://web.facebook.com/profile.php?id=61591131675150" target="_blank" rel="noopener noreferrer">Facebook</a><a className="cx-btn cx-btn-secondary" href="https://www.tiktok.com/@cintexadotcom" target="_blank" rel="noopener noreferrer">TikTok</a></div><p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">Business hours: contact us by email or WhatsApp to arrange a suitable response time. We have not published fixed office hours.</p></section>\n\n        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/get-started" className="cx-btn cx-btn-primary">
            Create an account
          </Link>
          <Link href="/solutions/website-development" className="cx-btn cx-btn-secondary">
            Website development
          </Link>
          <Link href="/solutions/software-development" className="cx-btn cx-btn-secondary">
            Software development
          </Link>
        </div>
      </div>
    </div>
  );
}

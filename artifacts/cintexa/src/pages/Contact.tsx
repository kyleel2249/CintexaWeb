import { useState, type FormEvent } from "react";
import { Link } from "wouter";

const PHONE_DISPLAY = "+233 24 248 3082";
const PHONE_TEL = "+233242483082";
const WHATSAPP = "https://wa.me/233242483082";

export function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus("sending");
    setErrorMessage("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || "").trim(),
          email: String(form.get("email") || "").trim(),
          business: String(form.get("business") || "").trim(),
          subject: String(form.get("subject") || "CINTEXA project enquiry").trim(),
          message: String(form.get("message") || "").trim(),
          website: String(form.get("website") || ""),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || result.error || "We could not send your enquiry right now. Please try again in a moment.");
      formElement.reset();
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "We could not send your enquiry right now. Please try again in a moment.");
    }
  }

  return (
    <div className="cx-section">
      <div className="cx-container max-w-5xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="cx-eyebrow">Contact</p>
          <h1 className="cx-display mt-3 text-3xl sm:text-4xl">Contact CINTEXA</h1>
          <p className="mt-4 text-[hsl(var(--fg-muted))]">Contact CINTEXA about website development, custom software, automation, e-commerce and digital business support. We work with businesses and project teams in Ghana and beyond.</p>
        </header>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          <a href="mailto:info@cintexa.com" className="cx-card cx-card-interactive block"><p className="cx-eyebrow">Email</p><p className="cx-display mt-2 text-lg">info@cintexa.com</p><p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Project and partnership enquiries.</p></a>
          <a href={`tel:${PHONE_TEL}`} className="cx-card cx-card-interactive block"><p className="cx-eyebrow">Call</p><p className="cx-display mt-2 text-lg">{PHONE_DISPLAY}</p><p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Speak with the team about your requirements.</p></a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="cx-card cx-card-interactive block border-t-2 border-t-[hsl(var(--accent))]"><p className="cx-eyebrow" style={{ color: "hsl(var(--accent))" }}>WhatsApp</p><p className="cx-display mt-2 text-lg">{PHONE_DISPLAY}</p><p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Message us for a quick conversation.</p></a>
        </div>

        <section className="cx-card mx-auto mt-8 w-full max-w-xl p-5 sm:p-7">
          <div className="text-center"><h2 className="cx-display text-xl">Send a project enquiry</h2><p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Share a few details and our team will get back to you.</p></div>
          <form onSubmit={handleSubmit} className="mx-auto mt-5 grid max-w-md gap-4">
            <label className="cx-label">Your name<input className="cx-input mt-2 w-full" name="name" required autoComplete="name" maxLength={120} /></label>
            <label className="cx-label">Email address<input className="cx-input mt-2 w-full" type="email" name="email" required autoComplete="email" maxLength={254} /></label>
            <label className="cx-label">Business / organisation (optional)<input className="cx-input mt-2 w-full" name="business" autoComplete="organization" maxLength={160} /></label>
            <label className="cx-label">Subject<input className="cx-input mt-2 w-full" name="subject" required defaultValue="CINTEXA project enquiry" maxLength={180} /></label>
            <label className="cx-label">How can we help?<textarea className="cx-input mt-2 min-h-32 w-full" name="message" required minLength={10} maxLength={5000} /></label>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <button type="submit" disabled={status === "sending"} className="cx-btn cx-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">{status === "sending" ? "Sending…" : "Send enquiry"}</button>
            {status === "sent" && <p role="status" aria-live="polite" className="text-sm text-green-700">Your enquiry has been sent successfully. Thank you for contacting CINTEXA.</p>}
            {status === "error" && <p role="alert" aria-live="assertive" className="text-sm text-red-600">{errorMessage}</p>}
          </form>
        </section>

        <section className="mx-auto mt-8 max-w-xl text-center"><h2 className="cx-display text-xl">Connect with CINTEXA</h2><div className="mt-3 flex flex-wrap justify-center gap-3"><a className="cx-btn cx-btn-secondary" href="https://web.facebook.com/profile.php?id=61591131675150" target="_blank" rel="noopener noreferrer">Facebook</a><a className="cx-btn cx-btn-secondary" href="https://www.tiktok.com/@cintexadotcom" target="_blank" rel="noopener noreferrer">TikTok</a></div><p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">Contact us by email or WhatsApp to arrange a suitable response time.</p></section>

        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/get-started" className="cx-btn cx-btn-primary">Create an account</Link><Link href="/solutions/website-development" className="cx-btn cx-btn-secondary">Website development</Link><Link href="/solutions/software-development" className="cx-btn cx-btn-secondary">Software development</Link></div>
      </div>
    </div>
  );
}

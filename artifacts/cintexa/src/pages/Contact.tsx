import { Link } from "wouter";

const EMAIL = "info@cintexa.com";
const PHONE_DISPLAY = "+233 24 248 3082";
const PHONE_TEL = "+233242483082";
const WHATSAPP = "https://wa.me/233242483082";

export function Contact() {
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

        <div className="mt-10 flex flex-wrap gap-3">
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

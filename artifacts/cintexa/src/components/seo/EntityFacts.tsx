import { Link } from "wouter";
import { ENTITY, SERVICES } from "@/data/site-entity";

/**
 * "CINTEXA at a glance": the plain-text fact sheet for the organisation. Everything comes from site-entity.ts, the same
 * source as the Organization JSON-LD and llms.txt, so what visitors read matches what machines read.
 */
export function EntityFacts({ className = "" }: { className?: string }) {
  return (
    <section aria-labelledby="entity-facts-title" className={`cx-card ${className}`} data-entity-facts>
      <h2 id="entity-facts-title" className="cx-display text-2xl">
        CINTEXA at a glance
      </h2>
      <p className="mt-3 leading-7 text-[hsl(var(--fg-muted))]">{ENTITY.definition}</p>
      <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="cx-eyebrow">Services</dt>
          <dd className="mt-1 text-[hsl(var(--fg-muted))]">
            <ul className="space-y-1">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <Link href={s.path} className="text-[hsl(var(--accent))] underline">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="space-y-4">
          <div>
            <dt className="cx-eyebrow">Where we work</dt>
            <dd className="mt-1 text-[hsl(var(--fg-muted))]">Online, serving businesses in {ENTITY.areaServed} and beyond. CINTEXA operates digitally; no public office address is published.</dd>
          </div>
          <div>
            <dt className="cx-eyebrow">Contact</dt>
            <dd className="mt-1 text-[hsl(var(--fg-muted))]">
              <a className="underline" href={`mailto:${ENTITY.email}`}>
                {ENTITY.email}
              </a>
              {" · "}
              <a className="underline" href={`tel:${ENTITY.phone}`}>
                {ENTITY.phoneDisplay}
              </a>
              {" · "}
              <a className="underline" href={ENTITY.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </dd>
          </div>
          <div>
            <dt className="cx-eyebrow">Official profiles</dt>
            <dd className="mt-1 text-[hsl(var(--fg-muted))]">
              <ul className="space-y-1">
                {ENTITY.sameAs.map((u) => (
                  <li key={u}>
                    <a className="underline" href={u} target="_blank" rel="noopener noreferrer">
                      {new URL(u).hostname.replace(/^(www|web)\./, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}

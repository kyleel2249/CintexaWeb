import { useEffect, useRef, useState } from "react";
import { buildShareLinks, copyText, nativeSharePage } from "@/lib/share";

/** Share any page: copy link, device share sheet, WhatsApp, LinkedIn, X, Facebook, email. */
export function ShareBar({ url, title, text, compact = false }: { url: string; title: string; text: string; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const links = buildShareLinks(url, text);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function flash(msg: string) {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 2500);
  }

  const cls = "cx-btn cx-btn-secondary cx-btn-sm";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Share ${title}`}>
      <button type="button" className={cls} onClick={async () => flash((await copyText(url)) ? "Link copied" : "Couldn’t copy — long-press the address bar instead")}>
        Copy link
      </button>
      {canShare && !compact && (
        <button type="button" className={cls} onClick={() => void nativeSharePage({ title, text, url })}>
          Share…
        </button>
      )}
      <a className={cls} href={links.whatsapp} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      {!compact && (
        <>
          <a className={cls} href={links.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a className={cls} href={links.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a className={cls} href={links.facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a className={cls} href={links.email}>
            Email
          </a>
        </>
      )}
      <span className="text-xs text-[hsl(var(--fg-muted))]" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { JobPosting } from "@/data/jobs";
import { jobCanonical } from "@/data/careers-seo";
import { copyText, jobShareLinks, nativeShare } from "@/lib/share";

/** Share one vacancy — every link points at that vacancy's own URL. */
export function JobShare({ job, compact = false }: { job: JobPosting; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const links = jobShareLinks(job);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function flash(text: string) {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 2500);
  }

  async function onCopy() {
    flash((await copyText(jobCanonical(job))) ? "Link copied" : "Couldn’t copy — long-press the address bar instead");
  }

  const link = "cx-btn cx-btn-secondary cx-btn-sm";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Share ${job.role}`}>
      <button type="button" className={link} onClick={onCopy}>
        Copy link
      </button>
      {canShare && !compact && (
        <button type="button" className={link} onClick={() => void nativeShare(job)}>
          Share…
        </button>
      )}
      <a className={link} href={links.whatsapp} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      {!compact && (
        <>
          <a className={link} href={links.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a className={link} href={links.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a className={link} href={links.facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a className={link} href={links.email}>
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

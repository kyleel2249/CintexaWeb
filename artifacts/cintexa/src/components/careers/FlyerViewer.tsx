import { useRef } from "react";
import type { JobPosting } from "@/data/jobs";
import { trackEvent } from "@/lib/tracking";

/**
 * The vacancy's original flyer: shown in the page, tap to enlarge in a native <dialog>
 * (focus-trapped, closes with Esc), with a link to open the image file itself.
 */
export function FlyerViewer({ job }: { job: JobPosting }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const portrait = job.socialImageHeight > job.socialImageWidth * 1.1;
  const alt = job.imageAlt ?? `${job.role} job vacancy — ${job.location}`;

  function open() {
    const d = dialog.current;
    if (!d) return;
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    trackEvent("job_flyer_view", { job_slug: job.slug });
  }
  function close() {
    const d = dialog.current;
    if (!d) return;
    if (typeof d.close === "function") d.close();
    else d.removeAttribute("open");
  }

  return (
    <figure className="m-0">
      <button
        type="button"
        onClick={open}
        className="block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-0"
        aria-label={`Enlarge the ${job.role} flyer`}
      >
        <img
          src={job.image}
          alt={alt}
          width={job.socialImageWidth}
          height={job.socialImageHeight}
          decoding="async"
          className={portrait ? "mx-auto h-auto max-h-[720px] w-full object-contain" : "aspect-[16/10] w-full object-cover"}
        />
      </button>
      <figcaption className="cx-no-print mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[hsl(var(--fg-muted))]">
        <span>Tap the flyer to enlarge it.</span>
        <a href={job.image} target="_blank" rel="noopener noreferrer" className="underline hover:text-[hsl(var(--fg))]">
          Open the original flyer
        </a>
      </figcaption>

      <dialog
        ref={dialog}
        aria-label={`${job.role} flyer`}
        className="m-auto max-h-[95vh] max-w-[min(95vw,720px)] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-2 backdrop:bg-black/70"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <button type="button" onClick={close} className="cx-btn cx-btn-secondary cx-btn-sm mb-2">
          Close
        </button>
        <img src={job.image} alt={alt} className="mx-auto h-auto max-h-[80vh] w-auto max-w-full object-contain" />
      </dialog>
    </figure>
  );
}

import type { JobPosting } from "@/data/jobs";
import { jobCanonical } from "@/data/careers-seo";

export type ShareLinks = { whatsapp: string; linkedin: string; x: string; facebook: string; email: string };

export function jobShareText(job: JobPosting): string {
  return job.employerName ? `${job.title} — ${job.employerName}` : job.title;
}

/** Share-intent URLs for one vacancy, always pointing at its own canonical page. */
export function jobShareLinks(job: JobPosting): ShareLinks {
  const url = jobCanonical(job);
  const text = jobShareText(job);
  const enc = encodeURIComponent;
  return {
    whatsapp: `https://wa.me/?text=${enc(`${text} ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    x: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    email: `mailto:?subject=${enc(text)}&body=${enc(`${text}\n${url}`)}`,
  };
}

/** Copies text; falls back to a hidden textarea where the async clipboard isn't available. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Uses the device's share sheet when there is one. Returns false if unavailable or cancelled. */
export async function nativeShare(job: JobPosting): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    await navigator.share({ title: job.title, text: jobShareText(job), url: jobCanonical(job) });
    return true;
  } catch {
    return false;
  }
}

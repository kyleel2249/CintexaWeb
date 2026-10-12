import type { JobPosting } from "@/data/jobs";
import { useSavedJobs } from "@/lib/saved-jobs";

/** Bookmark a vacancy (kept in this browser only). */
export function SaveJobButton({ job, className = "" }: { job: JobPosting; className?: string }) {
  const { isSaved, toggle } = useSavedJobs();
  const saved = isSaved(job.slug);
  return (
    <button
      type="button"
      className={`cx-btn cx-btn-secondary cx-btn-sm ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${job.role} from saved jobs` : `Save ${job.role}`}
      onClick={() => toggle(job.slug)}
    >
      <span aria-hidden>{saved ? "♥" : "♡"}</span> {saved ? "Saved" : "Save"}
    </button>
  );
}

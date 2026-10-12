/**
 * Server view of the public vacancies. Reads the SAME file the site is built from
 * (artifacts/cintexa/src/data/jobs.json), so the API can only ever accept applications for vacancies
 * that really exist and are still open.
 */
import jobsData from "../../artifacts/cintexa/src/data/jobs.json";

export type ServerJob = {
  slug: string;
  title: string;
  role: string;
  employerName?: string;
  status: string;
  validThrough?: string;
};

const JOBS = jobsData as unknown as ServerJob[];

export function findOpenJob(slug: unknown, now: Date = new Date()): ServerJob | undefined {
  if (typeof slug !== "string") return undefined;
  const job = JOBS.find((j) => j.slug === slug);
  if (!job || job.status !== "open") return undefined;
  if (job.validThrough) {
    const end = Date.parse(`${job.validThrough}T23:59:59Z`);
    if (!Number.isNaN(end) && end < now.getTime()) return undefined;
  }
  return job;
}

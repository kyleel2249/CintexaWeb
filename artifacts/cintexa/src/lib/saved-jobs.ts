import { useCallback, useSyncExternalStore } from "react";

/** Saved vacancies live only in this browser (no account needed, nothing sent anywhere). */
const KEY = "cintexa_saved_jobs";
const EVENT = "cintexa:saved-jobs";
const MAX = 100;

function read(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

// In-memory mirror so saving still works (for this tab) when storage is blocked.
let memory: string[] | null = null;
let snapshot: string[] = [];

function load(): string[] {
  if (memory === null) memory = read();
  return memory;
}

function write(list: string[]) {
  memory = list.slice(0, MAX);
  snapshot = memory;
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* storage unavailable — kept in memory only */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function getSavedSlugs(): string[] {
  return load();
}

export function toggleSavedSlug(slug: string): boolean {
  const list = load();
  const next = list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list];
  write(next);
  return next.includes(slug);
}

/** Test helper. */
export function resetSavedJobsForTests() {
  memory = null;
  snapshot = [];
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      memory = null; // another tab changed it
      cb();
    }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: string[] = [];
const getServerSnapshot = () => EMPTY; // stable reference (a fresh [] each read breaks useSyncExternalStore)

function getSnapshot(): string[] {
  const current = load();
  // Keep a stable reference between reads unless the content really changed.
  if (current.length !== snapshot.length || current.some((s, i) => s !== snapshot[i])) snapshot = current;
  return snapshot;
}

/** Live list of saved slugs plus helpers; every component using it stays in sync. */
export function useSavedJobs() {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isSaved = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const toggle = useCallback((slug: string) => toggleSavedSlug(slug), []);
  return { slugs, isSaved, toggle, count: slugs.length };
}

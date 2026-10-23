import { lazy, type ComponentType } from "react";

/**
 * After a deploy, a visitor's open tab still points at the OLD hashed chunk files, which no longer
 * exist (the host then answers with index.html), so a lazy route fails with "Failed to fetch
 * dynamically imported module" and the error boundary shows "This page hit a snag".
 * Recovery: reload once to pick up the new build. The guard stops a reload loop if the failure persists.
 */
const FLAG = "cintexa:chunk-reload";

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /dynamically imported module|importing a module script failed|loading chunk|ChunkLoadError|error loading dynamically|Unexpected token '<'|is not a valid JavaScript MIME type/i.test(
    message,
  );
}

/** Reloads the page once per session-window. Returns true when a reload was started. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(FLAG) ?? "0");
    if (last && Date.now() - last < 60_000) return false;
    sessionStorage.setItem(FLAG, String(Date.now()));
  } catch {
    return false; // storage blocked: do not risk a reload loop
  }
  window.location.reload();
  return true;
}

function markLoaded() {
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }
}

/** Drop-in replacement for React.lazy that recovers from stale chunks. */
export function lazyRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory();
      markLoaded();
      return mod;
    } catch (error) {
      if (isChunkLoadError(error) && reloadOnce()) return new Promise<{ default: T }>(() => {}); // page is reloading
      throw error;
    }
  });
}

/**
 * "Just signed in" hand-off. The sign-in/sign-up code calls markWelcome(); the dashboard picks it
 * up once per page load (surviving tab-to-tab navigation until dismissed or expired).
 */
export type WelcomeKind = "signin" | "signup";
export type Welcome = { kind: WelcomeKind; nonce: string; expiresAt: number };

const KEY = "cintexa_welcome";
const NONCE_KEY = "cintexa_greet_nonce";
const SHOW_FOR_MS = 15_000;
const STALE_AFTER_MS = 10 * 60_000;

const randomNonce = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function markWelcome(kind: WelcomeKind): void {
  try {
    const nonce = randomNonce();
    sessionStorage.setItem(KEY, JSON.stringify({ kind, nonce, at: Date.now() }));
    sessionStorage.setItem(NONCE_KEY, nonce); // new wording for the rest of this session too
  } catch {
    /* storage unavailable — no welcome banner, nothing else is affected */
  }
}

let loaded = false;
let current: Welcome | null = null;

/** Reads (and clears) the pending welcome once per page load; null once dismissed or expired. */
export function takeWelcome(now = Date.now()): Welcome | null {
  if (!loaded) {
    loaded = true;
    try {
      const raw = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
      const data = raw ? (JSON.parse(raw) as { kind?: string; nonce?: string; at?: number }) : null;
      if (data && (data.kind === "signin" || data.kind === "signup") && typeof data.nonce === "string" && now - (data.at ?? 0) < STALE_AFTER_MS) {
        current = { kind: data.kind, nonce: data.nonce, expiresAt: now + SHOW_FOR_MS };
      }
    } catch {
      current = null;
    }
  }
  if (current && now >= current.expiresAt) current = null;
  return current;
}

export function dismissWelcome(): void {
  loaded = true;
  current = null;
}

/** Stable per browser session so the header wording doesn't flicker between renders. */
export function sessionNonce(): string {
  try {
    let n = sessionStorage.getItem(NONCE_KEY);
    if (!n) {
      n = randomNonce();
      sessionStorage.setItem(NONCE_KEY, n);
    }
    return n;
  } catch {
    return "static";
  }
}

/** Test helper. */
export function resetWelcomeForTests(): void {
  loaded = false;
  current = null;
}

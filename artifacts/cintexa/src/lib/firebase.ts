/**
 * Firebase client initialization.
 * Core Firebase app services can initialise for requested account functionality,
 * but analytics is gated behind the visitor's explicit analytics preference.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { deleteAnalytics, getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const CONSENT_KEY = "cintexa.cookie.consent";
const CONSENT_EVENT = "cintexa:consent-updated";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

function hasMinimalConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const consent = JSON.parse(raw) as { analytics?: unknown };
    return consent.analytics === true;
  } catch {
    return false;
  }
}

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let consentListenerRegistered = false;

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (!hasMinimalConfig()) {
    if (import.meta.env.DEV) console.warn("[firebase] Missing VITE_FIREBASE_* env vars — Firebase disabled.");
    return null;
  }
  if (getApps().length > 0) app = getApps()[0]!;
  else app = initializeApp(firebaseConfig);
  return app;
}

/** Starts Firebase Analytics only after the visitor opts in. */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analytics || !hasAnalyticsConsent()) return analytics;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp || !firebaseConfig.measurementId || typeof window === "undefined") return null;
  try {
    if (!(await isSupported()) || !hasAnalyticsConsent()) return null;
    analytics = getAnalytics(firebaseApp);
    return analytics;
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[firebase] Analytics init failed", err);
    return null;
  }
}

async function applyAnalyticsConsent(): Promise<void> {
  if (hasAnalyticsConsent()) {
    await getFirebaseAnalytics();
    return;
  }
  if (analytics) {
    const current = analytics;
    analytics = null;
    try {
      await deleteAnalytics(current);
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[firebase] Analytics cleanup failed", err);
    }
  }
}

/** Initialises the app and responds to consent changes during the current page session. */
export function initFirebase(): FirebaseApp | null {
  const firebaseApp = getFirebaseApp();
  if (typeof window !== "undefined" && !consentListenerRegistered) {
    window.addEventListener(CONSENT_EVENT, () => { void applyAnalyticsConsent(); });
    consentListenerRegistered = true;
    if (hasAnalyticsConsent()) void getFirebaseAnalytics();
  }
  return firebaseApp;
}

export { firebaseConfig };

/**
 * Firebase client initialization.
 * Secrets / config are provided via Vite env (set in Cloudflare Pages).
 * The app is initialized once on import so Analytics / Auth / Firestore
 * are ready wherever they are used.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

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
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

/**
 * Initialize Firebase (idempotent). Returns the app instance or null if
 * config is missing so the rest of the app can still run.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (!hasMinimalConfig()) {
    if (import.meta.env.DEV) {
      console.warn(
        "[firebase] Missing VITE_FIREBASE_* env vars — Firebase disabled.",
      );
    }
    return null;
  }
  if (getApps().length > 0) {
    app = getApps()[0]!;
  } else {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

/**
 * Lazy Analytics (only in browser + when supported + measurementId present).
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analytics) return analytics;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp || !firebaseConfig.measurementId) return null;
  try {
    if (typeof window === "undefined") return null;
    const supported = await isSupported();
    if (!supported) return null;
    analytics = getAnalytics(firebaseApp);
    return analytics;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[firebase] Analytics init failed", err);
    }
    return null;
  }
}

/** Call once at app boot so Firebase is active for the session. */
export function initFirebase(): FirebaseApp | null {
  const firebaseApp = getFirebaseApp();
  if (firebaseApp) {
    // Fire-and-forget Analytics; do not block render
    void getFirebaseAnalytics();
  }
  return firebaseApp;
}

export { firebaseConfig };

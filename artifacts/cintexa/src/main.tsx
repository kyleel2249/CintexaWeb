import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import type { ReactNode } from "react";

import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";

import "./index.css";
import "./styles/design-system.css";

const publishableKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() || "";

/**
 * Clerk throws if publishableKey is missing/invalid.
 * Production Pages deploys often omit the env var → empty string → white-screen ErrorBoundary.
 * Boot the marketing site without Clerk; sign-in routes will need the key set in Cloudflare.
 */
function AuthRoot({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    if (import.meta.env.DEV) {
      console.warn(
        "[CINTEXA] VITE_CLERK_PUBLISHABLE_KEY is not set. Auth features are disabled until it is configured.",
      );
    }
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ baseTheme: dark }}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("CINTEXA: #root element not found in index.html");
}

createRoot(rootEl, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <AuthRoot>
      <App />
    </AuthRoot>
  </ErrorBoundary>,
);

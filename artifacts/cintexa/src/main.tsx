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
 * Boot the marketing site without Clerk when the key is absent.
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
      appearance={{
        baseTheme: dark,
        layout: {
          // Hides the "Development mode" strip on SignIn / SignUp while using pk_test_ keys
          unsafe_disableDevelopmentModeWarnings: true,
        },
        elements: {
          // Hide "Secured by Clerk" footer badge in the component chrome
          footer: { display: "none" },
          footerAction: { display: "none" },
          badge: { display: "none" },
          // Development mode banner (when still rendered by older builds)
          internal: { display: "none" },
        },
      }}
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

import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";

import "./index.css";
import "./styles/design-system.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

createRoot(document.getElementById("root")!, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ baseTheme: dark }}
      afterSignOutUrl="/"
    >
      <App />
    </ClerkProvider>
  </ErrorBoundary>,
);

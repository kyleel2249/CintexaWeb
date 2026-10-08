import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import { App } from "@/App";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/lib/auth";

import "./index.css";
import "./styles/design-system.css";

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
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>,
);

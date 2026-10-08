import { createRoot } from "react-dom/client";
import App from "@/App";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/lib/auth";
import { initFirebase } from "@/lib/firebase";

import "./index.css";
import "./styles/design-system.css";

// Initialize Firebase as early as possible so Analytics / other services are active
initFirebase();

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

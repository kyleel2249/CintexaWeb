import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Unknown render error",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CINTEXA render error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0B0F14",
          color: "#F7F4EE",
          fontFamily: "Manrope, system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#F5C518" }}>SOMETHING WENT WRONG</p>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontFamily: "Space Grotesk, system-ui, sans-serif" }}>
          This page hit a snag.
        </h1>
        <p style={{ color: "#A6AEB8", maxWidth: 420 }}>
          Reloading usually fixes it. If it keeps happening, check the browser console and Cloudflare
          env vars (especially VITE_CLERK_PUBLISHABLE_KEY).
        </p>
        {this.state.message ? (
          <pre
            style={{
              maxWidth: 520,
              overflow: "auto",
              textAlign: "left",
              fontSize: 12,
              color: "#A6AEB8",
              background: "#141A22",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #2A3340",
            }}
          >
            {this.state.message}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: 8,
            border: "none",
            borderRadius: 999,
            padding: "12px 20px",
            fontWeight: 700,
            cursor: "pointer",
            background: "#F5C518",
            color: "#0B0F14",
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

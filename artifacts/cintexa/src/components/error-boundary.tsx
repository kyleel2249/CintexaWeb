import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CINTEXA render error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
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
        <p className="cx-eyebrow">SOMETHING WENT WRONG</p>
        <h1 className="cx-display" style={{ fontSize: "1.75rem", margin: 0 }}>
          This page hit a snag.
        </h1>
        <p style={{ color: "#A6AEB8", maxWidth: 420 }}>
          Reloading usually fixes it. If it keeps happening, the issue has been logged.
        </p>
        <button className="cx-btn cx-btn-primary" onClick={this.handleReload}>
          Reload page
        </button>
      </div>
    );
  }
}

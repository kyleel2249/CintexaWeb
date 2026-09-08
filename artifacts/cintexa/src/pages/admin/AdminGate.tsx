import { useState, type ReactNode } from "react";
import { adminFetch } from "@/lib/adminApi";

/**
 * Prompts for the admin key and verifies it against a real endpoint before
 * rendering children. The key lives only in component state — never written
 * to localStorage/sessionStorage — so it clears on refresh by design.
 */
export function AdminGate({ children }: { children: (adminKey: string) => ReactNode }) {
  const [input, setInput] = useState("");
  const [verifiedKey, setVerifiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    try {
      await adminFetch("/admin/customers?limit=1", input);
      setVerifiedKey(input);
    } catch {
      setError("That key was rejected. Check ADMIN_API_KEY on the server.");
    } finally {
      setChecking(false);
    }
  }

  if (verifiedKey) return <>{children(verifiedKey)}</>;

  return (
    <div className="cx-section">
      <div className="cx-container flex justify-center">
        <form className="cx-card w-full max-w-sm" onSubmit={handleSubmit}>
          <p className="cx-eyebrow">Admin</p>
          <h1 className="cx-display mt-2 text-xl">Enter the admin key</h1>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
            This matches <code className="font-mono text-xs">ADMIN_API_KEY</code> on the API server.
          </p>
          <div className="cx-field mt-5">
            <input
              type="password"
              className="cx-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin API key"
              autoFocus
            />
          </div>
          {error && <p className="mt-3 text-sm" style={{ color: "hsl(var(--danger))" }}>{error}</p>}
          <button type="submit" className="cx-btn cx-btn-primary mt-5 w-full" disabled={checking || !input}>
            {checking ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

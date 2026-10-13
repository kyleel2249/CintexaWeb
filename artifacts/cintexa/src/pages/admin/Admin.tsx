import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ADMIN_SIGNED_OUT_EVENT, AdminApiError, adminRequest, clearAdminToken } from "@/lib/admin-client";
import { AdminReset, AdminSetup, AdminSignIn } from "./AdminAuth";
import { ActivityPanel, AlertsPanel, ApplicationsPanel, AuditPanel, OverviewPanel, UsersPanel } from "./AdminPanels";
import { OperationsPanel } from "./OperationsPanel";

type Session = { signedIn: boolean; username?: string; setupNeeded?: boolean };
const SESSION_KEY = ["admin", "session"] as const;

async function checkSession(): Promise<Session> {
  try {
    const me = await adminRequest<{ username: string }>("session");
    return { signedIn: true, username: me.username };
  } catch (e) {
    return { signedIn: false, setupNeeded: Boolean(e instanceof AdminApiError && e.body.setupNeeded) };
  }
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "activity", label: "Activity" },
  { id: "applications", label: "Applications" },
  { id: "alerts", label: "Alerts" },
  { id: "audit", label: "Audit log" },
  { id: "operations", label: "Operations" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Panel({ tab }: { tab: TabId }) {
  switch (tab) {
    case "overview":
      return <OverviewPanel />;
    case "users":
      return <UsersPanel />;
    case "activity":
      return <ActivityPanel />;
    case "applications":
      return <ApplicationsPanel />;
    case "alerts":
      return <AlertsPanel />;
    case "audit":
      return <AuditPanel />;
    case "operations":
      return <OperationsPanel />;
  }
}

/** /admin — username-and-password console for users, activity and analytics. */
export function Admin() {
  const qc = useQueryClient();
  const session = useQuery({ queryKey: SESSION_KEY, queryFn: checkSession, retry: false, refetchOnWindowFocus: false, staleTime: Infinity });
  const [tab, setTab] = useState<TabId>("overview");

  // One-time links from the e-mail sent to the CINTEXA inbox: /admin?setup=… and /admin?reset=…
  const [link, setLink] = useState<{ kind: "setup" | "reset"; token: string } | null>(() => {
    const p = new URLSearchParams(window.location.search);
    const setup = p.get("setup");
    const reset = p.get("reset");
    return setup ? { kind: "setup", token: setup } : reset ? { kind: "reset", token: reset } : null;
  });
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    document.title = "Admin | CINTEXA";
    const onSignedOut = () => qc.setQueryData<Session>(SESSION_KEY, { signedIn: false, setupNeeded: false });
    window.addEventListener(ADMIN_SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(ADMIN_SIGNED_OUT_EVENT, onSignedOut);
  }, [qc]);

  const leaveLink = () => {
    window.history.replaceState(null, "", "/admin");
    setLink(null);
  };
  const signedIn = (username: string) => {
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === "admin" && q.queryKey[1] !== "session" });
    qc.setQueryData<Session>(SESSION_KEY, { signedIn: true, username });
  };

  async function signOut() {
    await adminRequest("logout", { method: "POST" }).catch(() => undefined);
    clearAdminToken();
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === "admin" && q.queryKey[1] !== "session" });
    qc.setQueryData<Session>(SESSION_KEY, { signedIn: false, setupNeeded: false });
    setTab("overview");
  }

  if (link?.kind === "setup") {
    return (
      <AdminSetup
        token={link.token}
        onDone={(username) => {
          signedIn(username);
          leaveLink();
        }}
      />
    );
  }
  if (link?.kind === "reset") {
    return (
      <AdminReset
        token={link.token}
        onDone={() => {
          clearAdminToken();
          qc.setQueryData<Session>(SESSION_KEY, { signedIn: false, setupNeeded: false });
          setResetDone(true);
          leaveLink();
        }}
      />
    );
  }

  if (session.isLoading || !session.data) {
    return (
      <div className="cx-section">
        <div className="cx-container">
          <p className="text-sm text-[hsl(var(--fg-muted))]" role="status">
            Checking your session…
          </p>
        </div>
      </div>
    );
  }

  if (!session.data.signedIn) {
    return (
      <AdminSignIn
        setupNeeded={Boolean(session.data.setupNeeded)}
        onSignedIn={signedIn}
        initialNotice={resetDone ? "Password updated. Sign in with your new password." : ""}
      />
    );
  }

  return (
    <div className="cx-section">
      <div className="cx-container">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="cx-eyebrow">CINTEXA admin</p>
            <h1 className="cx-display mt-2 text-2xl sm:text-3xl">Admin console</h1>
            <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
              Signed in as <strong className="text-[hsl(var(--fg))]">{session.data.username}</strong>
            </p>
          </div>
          <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>

        <div role="tablist" aria-label="Admin sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-[hsl(var(--border))] pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`admin-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`admin-panel-${t.id}`}
              className="cx-nav-link shrink-0 whitespace-nowrap"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`admin-panel-${tab}`} aria-labelledby={`admin-tab-${tab}`} className="mt-6">
          <Panel tab={tab} />
        </div>
      </div>
    </div>
  );
}

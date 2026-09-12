import { AdminGate } from "./AdminGate";
import { CustomerList } from "./CustomerList";
import { LoyaltyAdjuster } from "./LoyaltyAdjuster";
import { AgentRunner } from "./AgentRunner";
import { SpecialistFlags } from "./SpecialistFlags";

export function Admin() {
  return (
    <AdminGate>
      {(adminKey) => (
        <div className="cx-section">
          <div className="cx-container">
            <p className="cx-eyebrow">Admin</p>
            <h1 className="cx-display mt-2 text-2xl sm:text-3xl">Operations panel</h1>
            <p className="mt-2 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
              Not linked from the site nav on purpose — bookmark <code className="font-mono text-xs">/admin</code>{" "}
              directly. The admin key you enter never leaves this browser tab.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <CustomerList adminKey={adminKey} />
              <LoyaltyAdjuster adminKey={adminKey} />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <SpecialistFlags adminKey={adminKey} />
              <AgentRunner adminKey={adminKey} />
            </div>
          </div>
        </div>
      )}
    </AdminGate>
  );
}

import { AdminGate } from "./AdminGate";
import { CustomerList } from "./CustomerList";
import { LoyaltyAdjuster } from "./LoyaltyAdjuster";
import { AgentRunner } from "./AgentRunner";
import { SpecialistFlags } from "./SpecialistFlags";

/** The original API-server operations panel (customers, loyalty, agents), gated by its own admin key. */
export function OperationsPanel() {
  return (
    <AdminGate>
      {(adminKey) => (
        <div>
          <h2 className="cx-display text-xl">Operations panel</h2>
          <p className="mt-2 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
            Customers, loyalty and agents from the API server. The admin key you enter never leaves this browser tab.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <CustomerList adminKey={adminKey} />
            <LoyaltyAdjuster adminKey={adminKey} />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SpecialistFlags adminKey={adminKey} />
            <AgentRunner adminKey={adminKey} />
          </div>
        </div>
      )}
    </AdminGate>
  );
}

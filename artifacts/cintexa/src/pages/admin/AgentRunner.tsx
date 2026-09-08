import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminApi";

const ROLE_EXAMPLES: Record<string, string> = {
  marketing: `{"channel": "email", "goal": "grow the list", "audienceSize": 5000}`,
  sales: `{"leadStage": "opportunity", "pageViews": 12, "emailOpens": 4, "pricingPageVisited": true}`,
  consumer_simulation: `{"productId": "prod_1", "persona": "premium", "touchpointCount": 2}`,
  engagement: `{"contentType": "post", "topic": "product launch", "actions": ["like", "comment"]}`,
  content_idea: `{"topic": "customer loyalty", "format": "blog", "count": 5}`,
};

interface AgentTask {
  id: string;
  role: string;
  status: string;
  input: unknown;
  output: unknown;
  createdAt: string;
}

export function AgentRunner({ adminKey }: { adminKey: string }) {
  const [role, setRole] = useState<keyof typeof ROLE_EXAMPLES>("content_idea");
  const [inputJson, setInputJson] = useState(ROLE_EXAMPLES.content_idea);
  const [parseError, setParseError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const tasks = useQuery({
    queryKey: ["admin", "agent-tasks"],
    queryFn: () => adminFetch<{ tasks: AgentTask[] }>("/admin/agents/tasks?limit=10", adminKey),
  });

  const run = useMutation({
    mutationFn: async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(inputJson);
      } catch {
        throw new Error("Input must be valid JSON");
      }
      return adminFetch<{ task: AgentTask }>("/admin/agents/run", adminKey, {
        method: "POST",
        body: { role, input: parsed },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "agent-tasks"] }),
    onError: (err) => setParseError((err as Error).message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className="cx-card flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setParseError(null);
          run.mutate();
        }}
      >
        <p className="cx-eyebrow">Run an agent</p>
        <div className="cx-field">
          <label className="cx-label" htmlFor="agent-role">Role</label>
          <select
            id="agent-role"
            className="cx-select"
            value={role}
            onChange={(e) => {
              const next = e.target.value as keyof typeof ROLE_EXAMPLES;
              setRole(next);
              setInputJson(ROLE_EXAMPLES[next]);
            }}
          >
            {Object.keys(ROLE_EXAMPLES).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="cx-field">
          <label className="cx-label" htmlFor="agent-input">Input (JSON)</label>
          <textarea
            id="agent-input"
            className="cx-textarea font-mono text-xs"
            rows={5}
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
          />
        </div>
        <button type="submit" className="cx-btn cx-btn-primary w-fit" disabled={run.isPending}>
          {run.isPending ? "Running…" : "Run agent"}
        </button>
        {parseError && <p className="text-sm" style={{ color: "hsl(var(--danger))" }}>{parseError}</p>}
        {run.data && (
          <pre className="cx-card-inset overflow-auto rounded-lg p-3 text-xs">
            {JSON.stringify(run.data.task.output, null, 2)}
          </pre>
        )}
      </form>

      <div className="cx-card !p-0 overflow-hidden">
        <div className="border-b border-[hsl(var(--border))] px-5 py-3">
          <p className="cx-eyebrow">Recent tasks</p>
        </div>
        {tasks.isLoading && <p className="px-5 py-4 text-sm text-[hsl(var(--fg-muted))]">Loading…</p>}
        {tasks.data?.tasks.length === 0 && (
          <p className="px-5 py-4 text-sm text-[hsl(var(--fg-muted))]">No agent tasks run yet.</p>
        )}
        {tasks.data && tasks.data.tasks.length > 0 && (
          <ul className="max-h-80 overflow-auto">
            {tasks.data.tasks.map((t) => (
              <li key={t.id} className="border-b border-[hsl(var(--border))] px-5 py-3 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="cx-badge">{t.role}</span>
                  <span className={`cx-badge ${t.status === "completed" ? "cx-badge-accent" : ""}`}>{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{new Date(t.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  AdminApiError,
  adminDownload,
  adminRequest,
  type AdminEvent,
  type AdminOverview,
  type AdminUser,
  type AuditRow,
} from "@/lib/admin-client";
import { getSeededContributions } from "@/data/contribution-seed";
import { BarList, TrendChart } from "./AdminCharts";
import { EVENT_TYPES, eventLabel, eventTone, formatWhen, shortUserAgent, toneClass, where } from "./admin-format";

const errText = (e: unknown) => (e instanceof AdminApiError ? e.message : "Something went wrong.");

function Loading() {
  return <p className="text-sm text-[hsl(var(--fg-muted))]">Loading…</p>;
}

function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="cx-card flex flex-wrap items-center justify-between gap-3" role="alert" style={{ borderColor: "hsl(var(--danger) / .5)" }}>
      <p className="text-sm">{errText(error)}</p>
      {onRetry && (
        <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

function TableWrap({ children }: { children: ReactNode }) {
  return <div className="cx-card overflow-x-auto !p-0">{children}</div>;
}
const th = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--fg-muted))]";
const td = "px-4 py-3 align-top text-sm";

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "danger" }) {
  return (
    <div className="cx-card">
      <p className="cx-eyebrow">{label}</p>
      <p className="cx-display mt-2 text-2xl tabular-nums" style={tone === "danger" && Number(value) > 0 ? { color: "hsl(var(--danger))" } : undefined}>
        {value}
      </p>
    </div>
  );
}

const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "—");

function EventBadge({ type }: { type: string }) {
  return <span className={toneClass(eventTone(type))}>{eventLabel(type)}</span>;
}

// ---------------------------------------------------------------- Overview

export function OverviewPanel() {
  const q = useQuery({ queryKey: ["admin", "overview"], queryFn: () => adminRequest<AdminOverview>("overview"), retry: false, refetchOnWindowFocus: false });
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  const { totals, trends, profile, countries, recent } = q.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total users" value={totals.users} />
        <Stat label="New · last 7 days" value={totals.newUsers7d} />
        <Stat label="New · last 30 days" value={totals.newUsers30d} />
        <Stat label="Active · last 7 days" value={profile.activeLast7d} />
        <Stat label="Sign-ins · 7 days" value={totals.logins7d} />
        <Stat label="Failed sign-ins · 7 days" value={totals.failedLogins7d} tone="danger" />
        <Stat label="Job applications" value={totals.applications} />
        <Stat label="Alert subscribers" value={totals.alertSubscribers} />
      </div>

      <div className="cx-card">
        <p className="cx-eyebrow">Last 30 days</p>
        <h2 className="cx-display mt-1 text-lg">Sign-ups and sign-ins</h2>
        <div className="mt-4">
          <TrendChart
            title="Sign-ups, sign-ins and failed sign-ins per day"
            dates={trends.dates}
            series={[
              { label: "Sign-ups", color: "hsl(var(--accent))", values: trends.signup },
              { label: "Sign-ins", color: "hsl(142 45% 63%)", values: trends.login_success },
              { label: "Failed sign-ins", color: "hsl(var(--danger))", values: trends.login_failed },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="cx-card">
          <p className="cx-eyebrow">Where users sign up from</p>
          <div className="mt-4">
            <BarList items={countries.map((c) => ({ label: c.country, value: c.users }))} empty="No location data captured yet." />
          </div>
        </div>
        <div className="cx-card">
          <p className="cx-eyebrow">Profile completeness</p>
          <div className="mt-4">
            <BarList
              items={[
                { label: "Date of birth", value: profile.withDateOfBirth, note: pct(profile.withDateOfBirth, profile.scanned) },
                { label: "Phone", value: profile.withPhone, note: pct(profile.withPhone, profile.scanned) },
                { label: "Company", value: profile.withCompany, note: pct(profile.withCompany, profile.scanned) },
              ]}
            />
          </div>
          <p className="mt-3 text-xs text-[hsl(var(--fg-muted))]">
            Based on {profile.scanned} {profile.scanned === 1 ? "account" : "accounts"}
            {profile.sampled ? " (the newest — there are more)" : ""}.
          </p>
        </div>
      </div>

      <div className="cx-card">
        <p className="cx-eyebrow">Latest activity</p>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[hsl(var(--border))]">
            {recent.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <EventBadge type={e.type} />
                <span className="min-w-0 truncate">{e.email ?? "—"}</span>
                <span className="text-xs text-[hsl(var(--fg-muted))]">
                  {where(e)} · {formatWhen(e.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Users

type UsersResponse = { users: AdminUser[]; total: number; page: number; pageSize: number; truncated?: boolean; scanned?: number };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[hsl(var(--fg-muted))]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children || "—"}</dd>
    </div>
  );
}

function UserDetail({ email, onClose }: { email: string; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["admin", "user", email],
    queryFn: () => adminRequest<{ user: AdminUser; history: AdminEvent[] }>("users", { query: { email } }),
    retry: false,
    refetchOnWindowFocus: false,
  });
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorBox error={q.error} />;
  const { user: u, history } = q.data;
  const contributions = getSeededContributions(u.id);
  const total = contributions.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);

  return (
    <section className="cx-card space-y-6" aria-label={`Details for ${u.fullName}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="cx-display text-xl">{u.fullName}</h3>
          <p className="text-sm text-[hsl(var(--fg-muted))]">{u.email}</p>
        </div>
        <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Phone">{u.phone}</Field>
        <Field label="Company">{u.company}</Field>
        <Field label="Job role">{u.role}</Field>
        <Field label="Date of birth">{u.dateOfBirth}</Field>
        <Field label="Time zone">{u.timeZone}</Field>
        <Field label="Birthday emails">{u.birthdayEmail ? "On" : "Off"}</Field>
        <Field label="Account created">{formatWhen(u.createdAt)}</Field>
        <Field label="Last sign-in">
          {formatWhen(u.lastLoginAt)}
          {u.lastLoginCity || u.lastLoginCountry ? ` · ${[u.lastLoginCity, u.lastLoginCountry].filter(Boolean).join(", ")}` : ""}
        </Field>
        <Field label="Sign-ins">{String(u.loginCount)}</Field>
        <Field label="Account ID">
          <code className="text-xs">{u.id}</code>
        </Field>
      </dl>

      {u.signup && (
        <div>
          <h4 className="cx-eyebrow">Sign-up details</h4>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="When">{formatWhen(u.signup.at)}</Field>
            <Field label="IP address">{u.signup.ip}</Field>
            <Field label="Location">{where(u.signup)}</Field>
            <Field label="Browser">{shortUserAgent(u.signup.userAgent)}</Field>
            <Field label="Language">{u.signup.language}</Field>
          </dl>
        </div>
      )}

      {contributions.length > 0 && (
        <div>
          <h4 className="cx-eyebrow">Contributions</h4>
          <p className="mt-2 text-sm">
            {contributions.length} payments · <strong>GHS {total.toFixed(2)}</strong> paid
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {contributions.map((c) => (
              <li key={c.id} className="cx-badge">
                {new Date(c.createdAt).toLocaleString(undefined, { month: "short", year: "numeric", timeZone: "UTC" })} · GHS {Number(c.amount).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="cx-eyebrow">Recent activity</h4>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">No activity recorded for this account.</p>
        ) : (
          <TableWrap>
            <table className="mt-0 w-full min-w-[34rem]">
              <thead>
                <tr>
                  <th className={th}>Event</th>
                  <th className={th}>When</th>
                  <th className={th}>Where</th>
                  <th className={th}>Device</th>
                </tr>
              </thead>
              <tbody>
                {history.map((e) => (
                  <tr key={e.id} className="border-t border-[hsl(var(--border))]">
                    <td className={td}>
                      <EventBadge type={e.type} />
                      {e.detail && <span className="ml-2 text-xs text-[hsl(var(--fg-muted))]">{e.detail}</span>}
                    </td>
                    <td className={td}>{formatWhen(e.at)}</td>
                    <td className={td}>
                      {where(e)}
                      {e.ip && <span className="block text-xs text-[hsl(var(--fg-muted))]">{e.ip}</span>}
                    </td>
                    <td className={td}>{shortUserAgent(e.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </div>
    </section>
  );
}

export function UsersPanel() {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"idle" | "busy" | "error">("idle");

  const q = useQuery({
    queryKey: ["admin", "users", submitted, page],
    queryFn: () => adminRequest<UsersResponse>("users", { query: { q: submitted, page, pageSize: 25 } }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  async function exportCsv() {
    setExporting("busy");
    try {
      await adminDownload("export", "cintexa-users.csv");
      setExporting("idle");
    } catch {
      setExporting("error");
    }
  }

  const data = q.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <form
          className="flex flex-1 flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSubmitted(search.trim());
          }}
          role="search"
        >
          <label className="min-w-[14rem] flex-1">
            <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Search users</span>
            <input className="cx-input mt-1 w-full" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone, company, country, ID" maxLength={100} />
          </label>
          <button type="submit" className="cx-btn cx-btn-primary cx-btn-sm">
            Search
          </button>
          {submitted && (
            <button
              type="button"
              className="cx-btn cx-btn-secondary cx-btn-sm"
              onClick={() => {
                setSearch("");
                setSubmitted("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </form>
        <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => void exportCsv()} disabled={exporting === "busy"}>
          {exporting === "busy" ? "Exporting…" : "Export CSV"}
        </button>
      </div>
      {exporting === "error" && (
        <p className="text-sm text-red-400" role="alert">
          The export failed. Try again.
        </p>
      )}

      {selected && <UserDetail email={selected} onClose={() => setSelected(null)} />}

      {q.isLoading ? (
        <Loading />
      ) : q.isError || !data ? (
        <ErrorBox error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <p className="text-sm text-[hsl(var(--fg-muted))]" role="status">
            {data.total} {data.total === 1 ? "user" : "users"}
            {submitted ? ` matching “${submitted}”` : ""}
            {data.truncated ? ` — searched the newest ${data.scanned}` : ""}
          </p>
          <TableWrap>
            <table className="w-full min-w-[44rem]">
              <thead>
                <tr>
                  <th className={th}>User</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Country</th>
                  <th className={th}>Joined</th>
                  <th className={th}>Last sign-in</th>
                  <th className={th}>Sign-ins</th>
                </tr>
              </thead>
              <tbody>
                {data.users.length === 0 && (
                  <tr>
                    <td className={td} colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                )}
                {data.users.map((u) => (
                  <tr key={u.id} className="border-t border-[hsl(var(--border))]">
                    <td className={td}>
                      <button type="button" className="text-left font-medium underline-offset-2 hover:underline" onClick={() => setSelected(u.email)} aria-label={`View ${u.fullName}`}>
                        {u.fullName}
                      </button>
                      <span className="block text-xs text-[hsl(var(--fg-muted))]">{u.email}</span>
                    </td>
                    <td className={td}>{u.phone ?? "—"}</td>
                    <td className={td}>{u.signup?.country ?? "—"}</td>
                    <td className={td}>{formatWhen(u.createdAt)}</td>
                    <td className={td}>{formatWhen(u.lastLoginAt)}</td>
                    <td className={`${td} tabular-nums`}>{u.loginCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Previous
              </button>
              <span className="text-[hsl(var(--fg-muted))]">
                Page {page} of {pages}
              </span>
              <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Activity

export function ActivityPanel() {
  const [type, setType] = useState("");
  const q = useInfiniteQuery({
    queryKey: ["admin", "activity", type],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      adminRequest<{ events: AdminEvent[]; cursor: string | null }>("activity", { query: { type, limit: 50, cursor: pageParam } }),
    getNextPageParam: (last) => last.cursor ?? undefined,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const events = q.data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <div className="space-y-4">
      <label className="block max-w-xs">
        <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">Event type</span>
        <select className="cx-input mt-1 w-full" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All activity</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {eventLabel(t)}
            </option>
          ))}
        </select>
      </label>
      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <TableWrap>
            <table className="w-full min-w-[46rem]">
              <thead>
                <tr>
                  <th className={th}>Event</th>
                  <th className={th}>Account</th>
                  <th className={th}>When</th>
                  <th className={th}>Where</th>
                  <th className={th}>Device</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td className={td} colSpan={5}>
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-[hsl(var(--border))]">
                    <td className={td}>
                      <EventBadge type={e.type} />
                      {e.detail && <span className="block text-xs text-[hsl(var(--fg-muted))]">{e.detail}</span>}
                    </td>
                    <td className={td}>{e.email ?? "—"}</td>
                    <td className={td}>{formatWhen(e.at)}</td>
                    <td className={td}>
                      {where(e)}
                      {e.ip && <span className="block text-xs text-[hsl(var(--fg-muted))]">{e.ip}</span>}
                    </td>
                    <td className={td}>{shortUserAgent(e.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          {q.hasNextPage && (
            <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => void q.fetchNextPage()} disabled={q.isFetchingNextPage}>
              {q.isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Applications / Alerts / Audit

type Application = { id: string; fullName: string; email?: string; phone?: string; location?: string; message?: string; jobRole: string; jobTitle: string; jobSlug: string; createdAt: string };

export function ApplicationsPanel() {
  const q = useQuery({ queryKey: ["admin", "applications"], queryFn: () => adminRequest<{ applications: Application[] }>("applications"), retry: false, refetchOnWindowFocus: false });
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  const rows = q.data.applications;
  return (
    <TableWrap>
      <table className="w-full min-w-[46rem]">
        <thead>
          <tr>
            <th className={th}>Vacancy</th>
            <th className={th}>Applicant</th>
            <th className={th}>Contact</th>
            <th className={th}>Message</th>
            <th className={th}>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className={td} colSpan={5}>
                No applications yet.
              </td>
            </tr>
          )}
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-[hsl(var(--border))]">
              <td className={td}>
                <a className="underline-offset-2 hover:underline" href={`/careers/${a.jobSlug}`}>
                  {a.jobRole}
                </a>
              </td>
              <td className={td}>
                {a.fullName}
                {a.location && <span className="block text-xs text-[hsl(var(--fg-muted))]">{a.location}</span>}
              </td>
              <td className={td}>
                {a.email ?? "—"}
                {a.phone && <span className="block text-xs text-[hsl(var(--fg-muted))]">{a.phone}</span>}
              </td>
              <td className={`${td} max-w-xs`}>
                <span className="line-clamp-3 whitespace-pre-wrap">{a.message ?? "—"}</span>
              </td>
              <td className={td}>{formatWhen(a.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

type Subscriber = { fullName: string; email: string; phone?: string; location?: string; interests?: string[]; createdAt?: string };

export function AlertsPanel() {
  const q = useQuery({ queryKey: ["admin", "alerts"], queryFn: () => adminRequest<{ subscribers: Subscriber[] }>("alerts"), retry: false, refetchOnWindowFocus: false });
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  const rows = q.data.subscribers;
  return (
    <TableWrap>
      <table className="w-full min-w-[40rem]">
        <thead>
          <tr>
            <th className={th}>Subscriber</th>
            <th className={th}>Phone</th>
            <th className={th}>Location</th>
            <th className={th}>Interests</th>
            <th className={th}>Signed up</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className={td} colSpan={5}>
                No subscribers yet.
              </td>
            </tr>
          )}
          {rows.map((s) => (
            <tr key={s.email} className="border-t border-[hsl(var(--border))]">
              <td className={td}>
                {s.fullName}
                <span className="block text-xs text-[hsl(var(--fg-muted))]">{s.email}</span>
              </td>
              <td className={td}>{s.phone || "—"}</td>
              <td className={td}>{s.location || "—"}</td>
              <td className={td}>{s.interests?.length ? s.interests.join(", ") : "—"}</td>
              <td className={td}>{formatWhen(s.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function AuditPanel() {
  const q = useQuery({ queryKey: ["admin", "audit"], queryFn: () => adminRequest<{ audit: AuditRow[] }>("audit"), retry: false, refetchOnWindowFocus: false });
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  const rows = q.data.audit;
  return (
    <TableWrap>
      <table className="w-full min-w-[36rem]">
        <thead>
          <tr>
            <th className={th}>Admin</th>
            <th className={th}>Action</th>
            <th className={th}>Detail</th>
            <th className={th}>When</th>
            <th className={th}>IP</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className={td} colSpan={5}>
                Nothing recorded yet.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[hsl(var(--border))]">
              <td className={td}>{r.admin}</td>
              <td className={td}>{r.action.replace(/_/g, " ")}</td>
              <td className={td}>{r.detail ?? "—"}</td>
              <td className={td}>{formatWhen(r.at)}</td>
              <td className={td}>{r.ip ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

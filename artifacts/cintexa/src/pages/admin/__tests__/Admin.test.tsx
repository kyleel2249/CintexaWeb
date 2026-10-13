import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Admin } from "../Admin";
import { clearAdminToken } from "@/lib/admin-client";

type Reply = { status?: number; body?: unknown; text?: string; headers?: Record<string, string> };
let routes: Record<string, (req: { init: RequestInit; url: URL }) => Reply>;
let calls: { key: string; init: RequestInit; url: URL }[];

const SEEDED = "31463b73-eb4a-4a76-8358-07e7aaad145c"; // Feb–Oct 2026, GHS 180

const overview = {
  totals: { users: 128, newUsers7d: 9, newUsers30d: 31, logins7d: 57, failedLogins7d: 4, applications: 6, alertSubscribers: 11 },
  trends: {
    dates: Array.from({ length: 30 }, (_, i) => `2026-09-${String((i % 28) + 1).padStart(2, "0")}`),
    signup: Array.from({ length: 30 }, (_, i) => i % 4),
    login_success: Array.from({ length: 30 }, (_, i) => i % 7),
    login_failed: Array.from({ length: 30 }, () => 0),
    application: [],
    alert_signup: [],
  },
  profile: { scanned: 100, sampled: true, withDateOfBirth: 25, withPhone: 60, withCompany: 10, activeLast7d: 14, neverSignedInAgain: 3 },
  countries: [
    { country: "GH", users: 80 },
    { country: "NG", users: 20 },
  ],
  recent: [{ id: "e1", type: "login_failed", at: "2026-10-11T09:00:00.000Z", email: "kofi@example.com", city: "Lagos", country: "NG" }],
};

const user = (over: Record<string, unknown> = {}) => ({
  id: "u-1",
  email: "ama@example.com",
  fullName: "Ama Mensah",
  phone: "+233 24 000 0000",
  company: "Acme",
  role: "Manager",
  dateOfBirth: "1990-10-10",
  timeZone: "Africa/Accra",
  birthdayEmail: true,
  createdAt: "2026-10-01T10:00:00.000Z",
  lastLoginAt: "2026-10-10T10:00:00.000Z",
  lastLoginIp: "203.0.113.7",
  lastLoginCountry: "GH",
  lastLoginCity: "Accra",
  loginCount: 4,
  signup: { at: "2026-10-01T10:00:00.000Z", ip: "203.0.113.7", country: "GH", city: "Accra", userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36", language: "en-GH" },
  ...over,
});

function mountAdmin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Admin />
    </QueryClientProvider>,
  );
}

const signedInRoutes = () => ({
  "GET /api/admin/session": () => ({ body: { username: "kyle.admin" } }),
  "GET /api/admin/overview": () => ({ body: overview }),
});

beforeEach(() => {
  calls = [];
  routes = {};
  sessionStorage.clear();
  localStorage.clear();
  clearAdminToken();
  window.history.replaceState(null, "", "/admin");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const url = new URL(String(input), "http://localhost");
      const key = `${init.method ?? "GET"} ${url.pathname}`;
      calls.push({ key, init, url });
      const handler = routes[key];
      if (!handler) return new Response(JSON.stringify({ error: `no route ${key}` }), { status: 500 });
      const r = handler({ init, url });
      const body = r.text !== undefined ? r.text : JSON.stringify(r.body ?? {});
      return new Response(body, { status: r.status ?? 200, headers: r.headers });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

const signedOut = (setupNeeded: boolean) => ({ "GET /api/admin/session": () => ({ status: 401, body: { error: "Unauthorized", setupNeeded } }) });

async function signIn() {
  routes = { ...signedOut(false), "POST /api/admin/login": () => ({ body: { token: "t".repeat(64), username: "kyle.admin" } }), "GET /api/admin/overview": () => ({ body: overview }) };
  mountAdmin();
  fireEvent.change(await screen.findByLabelText("Username"), { target: { value: "kyle.admin" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Adm1n!Strong-Pass-99" } });
  routes["GET /api/admin/session"] = () => ({ body: { username: "kyle.admin" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByRole("heading", { name: "Admin console" });
}

describe("signing in", () => {
  it("signs in with username and password, and keeps the token in sessionStorage only", async () => {
    await signIn();
    expect(screen.getByText("kyle.admin")).toBeInTheDocument();
    expect(sessionStorage.getItem("cintexa_admin_token")).toBe("t".repeat(64));
    expect(Object.keys(localStorage)).toEqual([]);
    const login = calls.find((c) => c.key === "POST /api/admin/login")!;
    expect(JSON.parse(String(login.init.body))).toEqual({ username: "kyle.admin", password: "Adm1n!Strong-Pass-99" });
    // the password field is cleared once signed in
    expect(screen.queryByLabelText("Password")).toBeNull();
  });

  it("shows the server's message for a wrong password and stays signed out", async () => {
    routes = { ...signedOut(false), "POST /api/admin/login": () => ({ status: 401, body: { error: "Invalid username or password." } }) };
    mountAdmin();
    fireEvent.change(await screen.findByLabelText("Username"), { target: { value: "kyle.admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
    expect(screen.queryByRole("heading", { name: "Admin console" })).toBeNull();
    expect(sessionStorage.getItem("cintexa_admin_token")).toBeNull();
  });

  it("resumes an existing session", async () => {
    sessionStorage.setItem("cintexa_admin_token", "a".repeat(64));
    routes = signedInRoutes();
    mountAdmin();
    expect(await screen.findByRole("heading", { name: "Admin console" })).toBeInTheDocument();
    expect(calls[0]!.init.headers).toMatchObject({ Authorization: `Bearer ${"a".repeat(64)}` });
  });

  it("offers first-time setup only when no admin exists, and mails the link to the inbox", async () => {
    routes = { ...signedOut(true), "POST /api/admin/setup-request": () => ({ body: { ok: true, sentTo: "info@cintexa.com" } }) };
    mountAdmin();
    fireEvent.click(await screen.findByRole("button", { name: /Send the setup link to info@cintexa.com/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("info@cintexa.com");
  });

  it("hides the setup option once an admin exists", async () => {
    routes = signedOut(false);
    mountAdmin();
    await screen.findByLabelText("Username");
    expect(screen.queryByRole("button", { name: /setup link/ })).toBeNull();
  });

  it("forgot password needs a username, then asks for a reset link", async () => {
    routes = { ...signedOut(false), "POST /api/admin/reset-request": () => ({ body: { ok: true, message: "If that admin exists, a reset link was sent to info@cintexa.com." } }) };
    mountAdmin();
    fireEvent.click(await screen.findByRole("button", { name: "Forgot password?" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter your username first.");
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "kyle.admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(await screen.findByRole("status")).toHaveTextContent("reset link was sent to info@cintexa.com");
    expect(calls.some((c) => c.key === "POST /api/admin/reset-request")).toBe(true);
  });
});

describe("one-time links", () => {
  it("setup link: creates the admin, signs in, and cleans the URL", async () => {
    window.history.replaceState(null, "", `/admin?setup=${"f".repeat(64)}`);
    routes = {
      "POST /api/admin/setup": () => ({ status: 201, body: { ok: true, username: "kyle.admin", token: "t".repeat(64) } }),
      "GET /api/admin/overview": () => ({ body: overview }),
    };
    mountAdmin();
    fireEvent.change(await screen.findByLabelText("Username"), { target: { value: "kyle.admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Adm1n!Strong-Pass-99" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: "Create admin account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("don’t match");
    expect(calls.some((c) => c.key === "POST /api/admin/setup")).toBe(false);

    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "Adm1n!Strong-Pass-99" } });
    fireEvent.click(screen.getByRole("button", { name: "Create admin account" }));
    expect(await screen.findByRole("heading", { name: "Admin console" })).toBeInTheDocument();
    expect(JSON.parse(String(calls.find((c) => c.key === "POST /api/admin/setup")!.init.body))).toMatchObject({ token: "f".repeat(64), username: "kyle.admin" });
    expect(window.location.search).toBe("");
  });

  it("setup link: shows the server's password rule", async () => {
    window.history.replaceState(null, "", `/admin?setup=${"f".repeat(64)}`);
    routes = { "POST /api/admin/setup": () => ({ status: 400, body: { error: "Use at least 12 characters." } }) };
    mountAdmin();
    fireEvent.change(await screen.findByLabelText("Username"), { target: { value: "kyle.admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Create admin account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Use at least 12 characters.");
  });

  it("reset link: sets a new password and returns to sign-in with a notice", async () => {
    window.history.replaceState(null, "", `/admin?reset=${"e".repeat(64)}`);
    routes = { "POST /api/admin/reset": () => ({ body: { ok: true } }), ...signedOut(false) };
    mountAdmin();
    fireEvent.change(await screen.findByLabelText("Password"), { target: { value: "N3w!Different-Pass-77" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "N3w!Different-Pass-77" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Password updated. Sign in with your new password.")).toBeInTheDocument();
    expect(JSON.parse(String(calls.find((c) => c.key === "POST /api/admin/reset")!.init.body))).toEqual({ token: "e".repeat(64), password: "N3w!Different-Pass-77" });
    expect(window.location.search).toBe("");
  });
});

describe("the console", () => {
  it("overview shows totals, trends, countries and recent activity", async () => {
    await signIn();
    await screen.findByText("Total users");
    const stat = (label: string) => screen.getByText(label).nextSibling?.textContent;
    expect(stat("Total users")).toBe("128");
    expect(stat("New · last 7 days")).toBe("9");
    expect(stat("Failed sign-ins · 7 days")).toBe("4");
    expect(stat("Job applications")).toBe("6");
    expect(screen.getByRole("img", { name: /Sign-ups, sign-ins and failed sign-ins per day/ })).toBeInTheDocument();
    expect(screen.getByText("GH")).toBeInTheDocument();
    expect(screen.getByText("Based on 100 accounts (the newest — there are more).")).toBeInTheDocument();
    expect(screen.getByText("Failed sign-in")).toBeInTheDocument();
    expect(screen.getByText("kofi@example.com")).toBeInTheDocument();
  });

  it("users: lists, searches, paginates and shows full details with history and contributions", async () => {
    await signIn();
    routes["GET /api/admin/users"] = ({ url }) => {
      if (url.searchParams.get("email")) {
        return {
          body: {
            user: user({ id: SEEDED }),
            history: [{ id: "h1", type: "login_failed", at: "2026-10-10T10:00:00.000Z", ip: "198.51.100.9", city: "Lagos", country: "NG", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X) Firefox/119.0", detail: "wrong password" }],
          },
        };
      }
      const q = url.searchParams.get("q");
      return { body: { users: q === "nobody" ? [] : [user({ id: SEEDED })], total: q === "nobody" ? 0 : 60, page: Number(url.searchParams.get("page")), pageSize: 25 } };
    };
    fireEvent.click(screen.getByRole("tab", { name: "Users" }));
    expect(await screen.findByText("ama@example.com")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
    await waitFor(() => expect(screen.getByText("Page 2 of 3")).toBeInTheDocument());
    expect(calls.filter((c) => c.key === "GET /api/admin/users").some((c) => c.url.searchParams.get("page") === "2")).toBe(true);

    fireEvent.change(screen.getByLabelText("Search users"), { target: { value: "nobody" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    fireEvent.click(await screen.findByRole("button", { name: "View Ama Mensah" }));
    const detail = await screen.findByRole("region", { name: "Details for Ama Mensah" });
    expect(within(detail).getByText("+233 24 000 0000")).toBeInTheDocument();
    expect(within(detail).getByText("1990-10-10")).toBeInTheDocument();
    expect(within(detail).getByText("Chrome on Windows")).toBeInTheDocument(); // sign-up browser
    expect(within(detail).getByText("Firefox on macOS")).toBeInTheDocument(); // history device
    expect(within(detail).getByText("198.51.100.9")).toBeInTheDocument();
    expect(within(detail).getByText("wrong password")).toBeInTheDocument();
    // contributions for this account come from the verified schedule: 9 payments, GHS 180.00
    expect(within(detail).getByText(/9 payments/)).toBeInTheDocument();
    expect(within(detail).getByText("GHS 180.00")).toBeInTheDocument();
    // secrets are never part of what the API returns or the UI renders
    expect(detail.textContent).not.toMatch(/passwordHash|salt/i);
  });

  it("users: exports a CSV with the admin token", async () => {
    await signIn();
    routes["GET /api/admin/users"] = () => ({ body: { users: [], total: 0, page: 1, pageSize: 25 } });
    routes["GET /api/admin/export"] = () => ({ text: "id,email\r\n", headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="cintexa-users-2026-10-11.csv"' } });
    const create = vi.fn(() => "blob:x");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("tab", { name: "Users" }));
    fireEvent.click(await screen.findByRole("button", { name: "Export CSV" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    const req = calls.find((c) => c.key === "GET /api/admin/export")!;
    expect(req.init.headers).toMatchObject({ Authorization: `Bearer ${"t".repeat(64)}` });
    expect(create).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith("blob:x");
    click.mockRestore();
  });

  it("activity: filters by type and loads more", async () => {
    await signIn();
    let page = 0;
    routes["GET /api/admin/activity"] = ({ url }) => {
      const type = url.searchParams.get("type");
      if (type === "login_failed") return { body: { events: [{ id: "f1", type: "login_failed", at: "2026-10-10T10:00:00.000Z", email: "x@example.com", ip: "1.2.3.4", detail: "unknown account" }], cursor: null } };
      page += 1;
      return page === 1
        ? { body: { events: [{ id: "a1", type: "signup", at: "2026-10-10T10:00:00.000Z", email: "first@example.com" }], cursor: "c1" } }
        : { body: { events: [{ id: "a2", type: "login_success", at: "2026-10-09T10:00:00.000Z", email: "second@example.com" }], cursor: null } };
    };
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(await screen.findByText("first@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("second@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Event type"), { target: { value: "login_failed" } });
    expect(await screen.findByText("x@example.com")).toBeInTheDocument();
    expect(screen.getByText("unknown account")).toBeInTheDocument();
    expect(screen.queryByText("first@example.com")).toBeNull();
  });

  it("applications, alerts and audit log tabs render their rows", async () => {
    await signIn();
    routes["GET /api/admin/applications"] = () => ({ body: { applications: [{ id: "1", fullName: "Kojo Asante", email: "kojo@example.com", phone: "+233 20 111 2222", message: "Reliable and punctual", jobRole: "Cleaners", jobTitle: "Cleaners", jobSlug: "cleaner", createdAt: "2026-10-10T10:00:00.000Z" }] } });
    routes["GET /api/admin/alerts"] = () => ({ body: { subscribers: [{ fullName: "Efua Owusu", email: "efua@example.com", interests: ["Internships", "Scholarships"], createdAt: "2026-10-09T10:00:00.000Z" }] } });
    routes["GET /api/admin/audit"] = () => ({ body: { audit: [{ id: "r1", at: "2026-10-11T08:00:00.000Z", admin: "kyle.admin", action: "export_users", detail: "128 of 128", ip: "203.0.113.7" }] } });

    fireEvent.click(screen.getByRole("tab", { name: "Applications" }));
    expect(await screen.findByText("Kojo Asante")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cleaners" })).toHaveAttribute("href", "/careers/cleaner");
    expect(screen.getByText("Reliable and punctual")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Alerts" }));
    expect(await screen.findByText("Efua Owusu")).toBeInTheDocument();
    expect(screen.getByText("Internships, Scholarships")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Audit log" }));
    expect(await screen.findByText("export users")).toBeInTheDocument();
    expect(screen.getByText("128 of 128")).toBeInTheDocument();
  });

  it("shows an error with a retry when a panel can't load", async () => {
    await signIn();
    routes["GET /api/admin/applications"] = () => ({ status: 500, body: { error: "Server error" } });
    fireEvent.click(screen.getByRole("tab", { name: "Applications" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
    routes["GET /api/admin/applications"] = () => ({ body: { applications: [] } });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No applications yet.")).toBeInTheDocument();
  });

  it("signing out clears the token and returns to the sign-in form", async () => {
    await signIn();
    routes["POST /api/admin/logout"] = () => ({ body: { ok: true } });
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(sessionStorage.getItem("cintexa_admin_token")).toBeNull();
    expect(calls.some((c) => c.key === "POST /api/admin/logout")).toBe(true);
  });

  it("an expired session sends the admin back to sign in", async () => {
    await signIn();
    routes["GET /api/admin/users"] = () => ({ status: 401, body: { error: "Unauthorized" } });
    fireEvent.click(screen.getByRole("tab", { name: "Users" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(sessionStorage.getItem("cintexa_admin_token")).toBeNull();
  });

  it("keeps the original operations panel as a tab", async () => {
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Operations" }));
    expect(screen.getByRole("tab", { name: "Operations" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { JOBS } from "@/data/jobs";
import { resetSavedJobsForTests } from "@/lib/saved-jobs";

const submitCareerAlert = vi.fn();
vi.mock("@/lib/email-notifications", () => ({ submitCareerAlert: (p: unknown) => submitCareerAlert(p) }));
const submitApplication = vi.fn();
vi.mock("@/lib/careers-api", () => ({ submitApplication: (p: unknown) => submitApplication(p) }));

import { ApplyForm } from "../careers/ApplyForm";
import { JobAlertForm } from "../careers/JobAlertForm";
import { JobCard } from "../careers/JobCard";
import { JobFilters } from "../careers/JobFilters";
import { DEFAULT_FILTERS } from "@/lib/careers-filter";

const NOW = new Date("2026-10-11T12:00:00Z");
const bybeth = JOBS.find((j) => j.slug === "bybeth-boutique-sales-girl")!;
const cleaner = JOBS.find((j) => j.slug === "cleaner")!;

beforeEach(() => {
  localStorage.clear();
  resetSavedJobsForTests();
  submitCareerAlert.mockReset();
  submitApplication.mockReset();
});

describe("JobCard", () => {
  it("gives the vacancy its own URL in several obvious places", () => {
    render(<JobCard job={cleaner} now={NOW} />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs.filter((h) => h === "/careers/cleaner").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: cleaner.title })).toHaveAttribute("href", "/careers/cleaner");
    expect(screen.getByRole("link", { name: "View role & apply" })).toHaveAttribute("href", "/careers/cleaner");
  });
  it("shows status badges", () => {
    render(<JobCard job={bybeth} now={NOW} />);
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Posted 2 days ago")).toBeInTheDocument();
    expect(screen.getByText("Flexible hours")).toBeInTheDocument();
  });
  it("saves and unsaves", () => {
    render(<JobCard job={cleaner} now={NOW} />);
    const btn = screen.getByRole("button", { name: `Save ${cleaner.role}` });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: `Remove ${cleaner.role} from saved jobs` })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("cintexa_saved_jobs")).toBe('["cleaner"]');
  });
  it("copies that vacancy's own link", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<JobCard job={cleaner} now={NOW} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://cintexa.com/careers/cleaner"));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });
});

describe("JobFilters", () => {
  const props = {
    filters: DEFAULT_FILTERS,
    onChange: vi.fn(),
    categories: [{ value: "Retail & fashion", count: 1 }],
    types: [{ value: "Full Time", count: 1 }],
    savedCount: 2,
    total: 2,
    shown: 2,
  };
  beforeEach(() => props.onChange.mockReset());

  it("reports changes and counts", () => {
    render(<JobFilters {...props} />);
    expect(screen.getByRole("status")).toHaveTextContent("2 open vacancies");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "sales" } });
    expect(props.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, q: "sales" });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Retail & fashion" } });
    expect(props.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, category: "Retail & fashion" });
    fireEvent.click(screen.getByRole("button", { name: /Saved \(2\)/ }));
    expect(props.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, saved: true });
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });
  it("shows 'Showing x of y' and a working clear button when filtering", () => {
    render(<JobFilters {...props} filters={{ ...DEFAULT_FILTERS, q: "sales" }} shown={1} />);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 1 of 2 vacancies");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(props.onChange).toHaveBeenLastCalledWith(DEFAULT_FILTERS);
    expect(screen.getByRole("button", { name: /Saved/ })).toHaveAttribute("aria-pressed", "false");
  });
});

function fillApply(over: Partial<Record<"name" | "email" | "phone", string>> = {}) {
  const get = (re: RegExp) => screen.getByLabelText(re) as HTMLInputElement;
  fireEvent.change(get(/Full name/), { target: { value: over.name ?? "Ama Mensah" } });
  fireEvent.change(get(/^Email/), { target: { value: over.email ?? "ama@example.com" } });
  if (over.phone !== undefined) fireEvent.change(get(/Phone/), { target: { value: over.phone } });
}

describe("ApplyForm", () => {
  it("blocks an empty or invalid application with field errors and does not call the API", async () => {
    render(<ApplyForm job={cleaner} />);
    fireEvent.click(screen.getByRole("button", { name: "Send application" }));
    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(screen.getByText(/email address or a phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toHaveAttribute("aria-invalid", "true");
    expect(submitApplication).not.toHaveBeenCalled();

    fillApply({ email: "nope" });
    fireEvent.click(screen.getByRole("button", { name: "Send application" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(submitApplication).not.toHaveBeenCalled();
  });

  it("sends the application for THIS vacancy and shows a reference", async () => {
    submitApplication.mockResolvedValue({ ok: true, id: "abcd1234-0000" });
    render(<ApplyForm job={bybeth} />);
    fillApply({ phone: "+233 24 000 0000" });
    fireEvent.click(screen.getByRole("button", { name: "Send application" }));
    expect(await screen.findByRole("heading", { name: "Application sent" })).toBeInTheDocument();
    expect(submitApplication).toHaveBeenCalledWith(
      expect.objectContaining({ jobSlug: "bybeth-boutique-sales-girl", fullName: "Ama Mensah", email: "ama@example.com", phone: "+233 24 000 0000", website: "" }),
    );
    expect(screen.getByText(/ABCD1234/)).toBeInTheDocument();
  });

  it("shows server errors and keeps what the person typed", async () => {
    submitApplication.mockResolvedValue({ ok: false, error: "You’ve already applied for this vacancy." });
    render(<ApplyForm job={cleaner} />);
    fillApply();
    fireEvent.click(screen.getByRole("button", { name: "Send application" }));
    expect(await screen.findByText("You’ve already applied for this vacancy.")).toBeInTheDocument();
    expect((screen.getByLabelText(/Full name/) as HTMLInputElement).value).toBe("Ama Mensah");
    expect(screen.getByRole("button", { name: "Send application" })).toBeEnabled();
  });

  it("does not double-submit", async () => {
    let resolve!: (v: unknown) => void;
    submitApplication.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ApplyForm job={cleaner} />);
    fillApply();
    fireEvent.click(screen.getByRole("button", { name: "Send application" }));
    expect(await screen.findByRole("button", { name: "Sending…" })).toBeDisabled();
    fireEvent.submit(screen.getByRole("button", { name: "Sending…" }).closest("form")!);
    expect(submitApplication).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ ok: true, id: "x".repeat(10) }));
  });

  it("passes the honeypot through so the server can drop bots", async () => {
    submitApplication.mockResolvedValue({ ok: true, id: "abcdefghij" });
    render(<ApplyForm job={cleaner} />);
    fillApply();
    fireEvent.change(screen.getByLabelText("Website"), { target: { value: "http://spam.example" } });
    fireEvent.click(screen.getByRole("button", { name: "Send application" }));
    await waitFor(() => expect(submitApplication).toHaveBeenCalledWith(expect.objectContaining({ website: "http://spam.example" })));
  });
});

describe("JobAlertForm", () => {
  const fill = (email = "ama@example.com") => {
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Ama Mensah" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: email } });
  };

  it("rejects an invalid email instead of accepting any text", async () => {
    render(<JobAlertForm />);
    fill("not-an-email");
    fireEvent.click(screen.getByRole("button", { name: "Get job & scholarship emails" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(submitCareerAlert).not.toHaveBeenCalled();
  });

  it("interest chips announce their state", () => {
    render(<JobAlertForm />);
    const chip = screen.getByRole("button", { name: "Internships" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("only says 'You're on the list' when the signup really worked, and keeps nothing in the browser", async () => {
    submitCareerAlert.mockResolvedValue({ ok: true });
    render(<JobAlertForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Internships" }));
    fireEvent.click(screen.getByRole("button", { name: "Get job & scholarship emails" }));
    expect(await screen.findByText(/You’re on the list/)).toBeInTheDocument();
    expect(submitCareerAlert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ama@example.com", interests: ["Internships"], source: "careers_page", website: "" }),
    );
    expect(localStorage.getItem("cintexa_career_alerts")).toBeNull();
    expect(Object.keys(localStorage)).toEqual([]);
    expect((screen.getByLabelText(/^Email/) as HTMLInputElement).value).toBe(""); // form reset
  });

  it("tells the truth when it fails — no false success, no surprise pop-up", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    submitCareerAlert.mockResolvedValue({ ok: false, error: "This email address has already signed up recently." });
    render(<JobAlertForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Get job & scholarship emails" }));
    expect(await screen.findByText(/already signed up recently/)).toBeInTheDocument();
    expect(screen.queryByText(/You’re on the list/)).toBeNull();
    expect(screen.getByRole("link", { name: "Email us instead" })).toHaveAttribute("href", expect.stringContaining("mailto:info@cintexa.com"));
    expect(open).not.toHaveBeenCalled();
    expect(Object.keys(localStorage)).toEqual([]);
    open.mockRestore();
  });

  it("handles a network failure the same way", async () => {
    submitCareerAlert.mockRejectedValue(new Error("offline"));
    render(<JobAlertForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Get job & scholarship emails" }));
    expect(await screen.findByText(/couldn’t reach CINTEXA/)).toBeInTheDocument();
    expect(screen.queryByText(/You’re on the list/)).toBeNull();
  });
});

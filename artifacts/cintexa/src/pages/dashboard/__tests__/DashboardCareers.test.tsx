import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { getOpenJobs } from "@/data/jobs";
import { resetSavedJobsForTests } from "@/lib/saved-jobs";

vi.mock("../DashboardShell", () => ({ DashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));

import { DashboardCareers } from "../Careers";

const jobs = getOpenJobs();

beforeEach(() => {
  localStorage.clear();
  resetSavedJobsForTests();
});

describe("dashboard → Careers", () => {
  it("lists the real vacancies, each linking to its own public page", () => {
    render(<DashboardCareers />);
    const section = screen.getByRole("heading", { name: "Open vacancies" }).closest("section")!;
    for (const job of jobs) {
      expect(within(section).getByRole("link", { name: job.title })).toHaveAttribute("href", `/careers/${job.slug}`);
    }
    expect(within(section).getAllByRole("link", { name: "View role" })).toHaveLength(jobs.length);
  });

  it("no longer shows invented sample roles or scholarships", () => {
    render(<DashboardCareers />);
    for (const fake of [/Frontend Engineer/i, /Growth Marketing Associate/i, /Customer Success Intern/i, /Digital Skills Scholarship/i, /Women in Technology/i, /sample/i]) {
      expect(screen.queryByText(fake)).toBeNull();
    }
    expect(screen.getByText(/No scholarship programmes are open right now/)).toBeInTheDocument();
  });

  it("shows saved jobs at the top once something is saved", () => {
    render(<DashboardCareers />);
    expect(screen.queryByRole("heading", { name: /Saved jobs/ })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /^Save / })[0]!);
    const saved = screen.getByRole("heading", { name: "Saved jobs (1)" }).closest("section")!;
    expect(within(saved).getByRole("link", { name: jobs[0]!.title })).toHaveAttribute("href", `/careers/${jobs[0]!.slug}`);
  });

  it("links back to the public careers page", () => {
    render(<DashboardCareers />);
    expect(screen.getByRole("link", { name: "All vacancies & alerts" })).toHaveAttribute("href", "/careers");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { JOBS } from "@/data/jobs";
import { resetSavedJobsForTests, toggleSavedSlug, useSavedJobs } from "../saved-jobs";
import { copyText, jobShareLinks, nativeShare } from "../share";
import { validateAlertSignup, validateApplication } from "../careers-validation";
import { submitApplication } from "../careers-api";

const job = JOBS[0]!;

describe("saved jobs", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSavedJobsForTests();
  });

  it("toggles, persists, and keeps every component in sync", () => {
    const a = renderHook(() => useSavedJobs());
    const b = renderHook(() => useSavedJobs());
    expect(a.result.current.count).toBe(0);
    act(() => void a.result.current.toggle("cleaner"));
    expect(a.result.current.isSaved("cleaner")).toBe(true);
    expect(b.result.current.isSaved("cleaner")).toBe(true); // other component updated too
    expect(JSON.parse(localStorage.getItem("cintexa_saved_jobs")!)).toEqual(["cleaner"]);
    act(() => void a.result.current.toggle("cleaner"));
    expect(b.result.current.count).toBe(0);
  });
  it("lists the newest save first, and survives a reload", () => {
    toggleSavedSlug("a");
    toggleSavedSlug("b");
    resetSavedJobsForTests(); // like a fresh page load
    const { result } = renderHook(() => useSavedJobs());
    expect(result.current.slugs).toEqual(["b", "a"]);
  });
  it("ignores corrupt storage", () => {
    localStorage.setItem("cintexa_saved_jobs", "{oops");
    resetSavedJobsForTests();
    expect(renderHook(() => useSavedJobs()).result.current.slugs).toEqual([]);
  });
  it("stores only slugs — nothing personal", () => {
    toggleSavedSlug("cleaner");
    expect(localStorage.getItem("cintexa_saved_jobs")).toBe('["cleaner"]');
  });
});

describe("share", () => {
  it("builds links that all point at the vacancy's own page", () => {
    const links = jobShareLinks(job);
    const url = `https://cintexa.com/careers/${job.slug}`;
    expect(decodeURIComponent(links.whatsapp)).toContain(url);
    expect(decodeURIComponent(links.linkedin)).toContain(url);
    expect(decodeURIComponent(links.x)).toContain(url);
    expect(decodeURIComponent(links.facebook)).toContain(url);
    expect(decodeURIComponent(links.email)).toContain(url);
    expect(links.whatsapp.startsWith("https://wa.me/?text=")).toBe(true);
  });
  it("copies with the clipboard API and falls back when it fails", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    expect(await copyText("hello")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) } });
    document.execCommand = vi.fn(() => true);
    expect(await copyText("hello")).toBe(true);
    document.execCommand = vi.fn(() => false);
    expect(await copyText("hello")).toBe(false);
  });
  it("uses the native share sheet only when there is one", async () => {
    Object.assign(navigator, { share: undefined });
    expect(await nativeShare(job)).toBe(false);
    const share = vi.fn(async () => undefined);
    Object.assign(navigator, { share });
    expect(await nativeShare(job)).toBe(true);
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: `https://cintexa.com/careers/${job.slug}` }));
    Object.assign(navigator, { share: vi.fn(async () => Promise.reject(new Error("cancelled"))) });
    expect(await nativeShare(job)).toBe(false);
  });
});

describe("validation", () => {
  const ok = { fullName: "Ama Mensah", email: "ama@example.com", phone: "", message: "" };
  it("applications need a name and some way to reach the person", () => {
    expect(validateApplication(ok)).toEqual({});
    expect(validateApplication({ ...ok, email: "", phone: "+233 24 000 0000" })).toEqual({});
    expect(validateApplication({ ...ok, email: "", phone: "" }).email).toMatch(/email address or a phone/);
    expect(validateApplication({ ...ok, fullName: "A" }).fullName).toBeTruthy();
    expect(validateApplication({ ...ok, email: "not-an-email" }).email).toMatch(/valid email/);
    expect(validateApplication({ ...ok, phone: "abc" }).phone).toMatch(/valid phone/);
    expect(validateApplication({ ...ok, message: "x".repeat(1501) }).message).toBeTruthy();
  });
  it("alerts need a real email", () => {
    expect(validateAlertSignup({ fullName: "Ama", email: "", phone: "" }).email).toBe("Enter your email address.");
    expect(validateAlertSignup({ fullName: "Ama", email: "ama@x", phone: "" }).email).toMatch(/valid email/);
    expect(validateAlertSignup({ fullName: "Ama", email: "ama@example.com", phone: "" })).toEqual({});
  });
});

describe("submitApplication", () => {
  const payload = { jobSlug: "cleaner", fullName: "Ama Mensah", email: "ama@example.com" };
  const res = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
  it("returns the reference on success", async () => {
    expect(await submitApplication(payload, res(201, { ok: true, id: "abc" }))).toEqual({ ok: true, id: "abc" });
  });
  it("surfaces server messages and field errors", async () => {
    const r = await submitApplication(payload, res(400, { error: "Please check.", fieldErrors: { email: "Bad" } }));
    expect(r).toEqual({ ok: false, error: "Please check.", fieldErrors: { email: "Bad" } });
    expect((await submitApplication(payload, res(429, {}))).ok).toBe(false);
  });
  it("never throws when offline", async () => {
    const r = await submitApplication(payload, (async () => Promise.reject(new Error("offline"))) as unknown as typeof fetch);
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining("couldn’t reach") });
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Contact } from "../Contact";

const subject = () => (document.querySelector('input[name="subject"]') as HTMLInputElement).value;
const message = () => (document.querySelector('textarea[name="message"]') as HTMLTextAreaElement).value;

beforeEach(() => window.history.replaceState(null, "", "/contact"));

describe("Contact form prefill (?subject=…&message=…)", () => {
  it("keeps the normal defaults without parameters", () => {
    render(<Contact />);
    expect(subject()).toBe("CINTEXA project enquiry");
    expect(message()).toBe("");
  });
  it("pre-fills from the link, e.g. from a case study", () => {
    const p = new URLSearchParams({ subject: "Project enquiry: E-commerce", message: 'I read your "Shop" case study.\n\nAbout my project:\n' });
    window.history.replaceState(null, "", `/contact?${p}`);
    render(<Contact />);
    expect(subject()).toBe("Project enquiry: E-commerce");
    expect(message()).toBe('I read your "Shop" case study.\n\nAbout my project:\n');
  });
  it("caps lengths and falls back when the subject is blank", () => {
    window.history.replaceState(null, "", `/contact?subject=${"s".repeat(500)}&message=${"m".repeat(9000)}`);
    render(<Contact />);
    expect(subject()).toHaveLength(180);
    expect(message()).toHaveLength(5000);
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/contact?subject=%20%20&message=hi");
    render(<Contact />);
    expect(subject()).toBe("CINTEXA project enquiry");
  });
});

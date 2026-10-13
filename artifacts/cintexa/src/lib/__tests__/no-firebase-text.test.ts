import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(full, out);
    } else if (/\.(tsx|ts|json|md|html)$/.test(e.name)) out.push(full);
  }
  return out;
}

describe("visitor-facing text", () => {
  // Only the tiny client bootstrap (lib/firebase.ts, main.tsx) may mention the SDK by name — it is code,
  // not text any visitor sees. Everything else (pages, components, data, copy) must stay clear of it.
  const allowed = new Set(["lib/firebase.ts", "main.tsx"]);

  it("never shows the word “Firebase” in pages, components, data or legal copy", () => {
    const offenders = walk(SRC)
      .map((f) => path.relative(SRC, f).split(path.sep).join("/"))
      .filter((rel) => !allowed.has(rel))
      .filter((rel) => /firebase/i.test(fs.readFileSync(path.join(SRC, rel), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("the privacy policy uses the requested heading", () => {
    const legal = fs.readFileSync(path.join(SRC, "pages/LegalPages.tsx"), "utf8");
    expect(legal).toContain('title="5. Hosting, Database and Google service"');
  });
});

describe("policy wording", () => {
  const legal = fs.readFileSync(path.join(SRC, "pages/LegalPages.tsx"), "utf8");
  const trust = fs.readFileSync(path.join(SRC, "pages/TrustPages.tsx"), "utf8");

  it("uses the requested date-of-birth sentence", () => {
    expect(legal).toContain("If you choose to add your date of birth, we use it only to improve your experience with us.");
    expect(legal).not.toMatch(/send you birthday wishes/);
    expect(trust).not.toMatch(/birthday wishes/);
  });

  it("refers to “Children or minors”", () => {
    expect(legal).toContain('title="13. Children or minors and third-party websites"');
    expect(legal).toContain("children or minors");
    expect(trust).toContain('title="Children or minors, updates and contact"');
  });
});

describe("security disclosure", () => {
  const legal = fs.readFileSync(path.join(SRC, "pages/LegalPages.tsx"), "utf8");
  const trust = fs.readFileSync(path.join(SRC, "pages/TrustPages.tsx"), "utf8");

  it("the policy says what sign-in data is recorded, for how long, and that passwords are never stored readable", () => {
    for (const text of [legal, trust]) {
      expect(text).toMatch(/IP address/);
      expect(text).toMatch(/approximate location/);
      expect(text).toMatch(/13 months/);
      expect(text).toMatch(/never store (your )?passwords? in readable form/);
      expect(text).toMatch(/salted, one-way hash/);
    }
  });
});


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

/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { gaatekart, kveldDag } from "../guide-sesong";
import { diagramKanter } from "../gaate-diagram";

const dager = Array.from({ length: 24 }, (_, i) => i + 1);

describe("gåtediagram", () => {
  it("reads explicit ids, numbered things and screen sources; never the kids", () => {
    const h = [
      { id: "H1", tekst: "Sju sko i ring i gangen." },
      { id: "H2", tekst: "Under sko 3 ligger M." },
    ];
    const s = [{ id: "S1", tekst: "x", kilde: "julius" }];
    const r = diagramKanter(
      ["H9 ser i sko 3", "Julius sier [S1]", "K12 taster"],
      h,
      s,
    );
    expect(r.kanter).toEqual(
      expect.arrayContaining([
        { steg: 0, bit: "H2", sikker: true },
        { steg: 1, bit: "S1", sikker: true },
      ]),
    );
    expect(r.kanter.some((k) => k.bit === "H9")).toBe(false);
    expect(r.stegUten).toEqual([2]);
  });

  it.each(dager)("day %i: every step and every reference parses", (n) => {
    const k = gaatekart(n);
    const d = kveldDag(n)!;
    expect(d.slikLoses.length).toBeGreaterThan(0);
    const r = diagramKanter(d.slikLoses, k.hjemme, k.skjerm);
    const ids = new Set([...k.hjemme, ...k.skjerm].map((b) => b.id));
    for (const e of r.kanter) {
      expect(ids.has(e.bit)).toBe(true);
      expect(e.steg).toBeLessThan(d.slikLoses.length);
    }
    // Every day's riddle uses at least one house and one screen piece.
    expect(r.kanter.some((e) => e.bit.startsWith("H"))).toBe(true);
  });

  it.each(dager)("day %i: kid abbreviations shown as names", (n) => {
    const d = kveldDag(n)!;
    const tekst = [...d.slikLoses, ...d.hint, ...d.sjekkliste, d.hanna].join(
      "\n",
    );
    expect(tekst).not.toMatch(/\b(?:H9|K12|H5)\b/);
  });

  it("lists unused pieces (report, not a failure)", () => {
    const rad = dager
      .map((n) => {
        const k = gaatekart(n);
        const r = diagramKanter(kveldDag(n)!.slikLoses, k.hjemme, k.skjerm);
        return `${n}: ubrukt ${r.ubrukt.join(",") || "-"}; steg uten ${r.stegUten.map((i) => i + 1).join(",") || "-"}`;
      })
      .join("\n");
    if (process.env.DIAGRAM_RAPPORT) console.log(rad);
    expect(rad).toContain("1:");
  });
});

describe("oppsett jobs", () => {
  const medier = JSON.parse(
    readFileSync("assets/medier.json", "utf8"),
  ) as Record<
    string,
    { dag?: number; ut?: string; mal?: string; generator?: string }
  >;
  const gaater = readFileSync("docs/gaater-2026.md", "utf8");
  const jobs = Object.entries(medier).filter(([id]) =>
    id.startsWith("oppsett/"),
  );
  it.each(jobs)("%s is valid and has its Oppsettskisse line", (id, j) => {
    const dd = String(j.dag).padStart(2, "0");
    expect(id).toBe(`oppsett/dag${dd}`);
    expect(j.ut).toBe(`strek/oppsett-dag${dd}.png`);
    expect(j.generator).toBe("still");
    expect(readFileSync(j.mal!, "utf8")).toContain("{{oppsett}}");
    const blokk =
      gaater.split(/^### /m).find((b) => b.startsWith(`Dag ${j.dag} `)) ?? "";
    expect(blokk).toMatch(/^- \*\*Oppsettskisse:\*\* \S/m);
  });
});

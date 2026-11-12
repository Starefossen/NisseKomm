/** @jest-environment node */
// Every place that shows a day's rampestrek must match historie §8 (long text)
// and §8.1 (short forms). Fix by editing historie and running
// python3 scripts/oppdrag-innhold.py (then node scripts/guide-innhold.mjs).
import { readFileSync } from "node:fs";
import { describe, it, expect } from "@jest/globals";
import { getAllOppdrag } from "../oppdrag";
import { kveldDag, seksjon, strekTitler, tabell } from "../guide-sesong";

const historie = readFileSync("docs/historie-2026.md", "utf8");
const radio = readFileSync("docs/manus/rampenissen-radio-2026.md", "utf8");
const perDag = (t: string) => new Map(tabell(t).map((r) => [Number(r[0]), r]));
const lang = perDag(seksjon(historie, "8. Rampestreker").split("### 8.1 ")[0]);
const kort = perDag(seksjon(historie, "8.1 Korte former"));
const s4 = perDag(seksjon(historie, "4. Dag for dag"));
// Cell index as tabell() returns it (no leading empty cell).
const s4kol =
  seksjon(historie, "4. Dag for dag")
    .split("\n")
    .find((l) => l.startsWith("| Dag "))!
    .split("|")
    .map((c) => c.trim())
    .indexOf("Strek") - 1;
// Notes for the parent, not the scene: same rule as uten_merknad in oppdrag-innhold.py.
const utenMerknad = (t: string) => t.replace(/\s*\([^()]*\)$/, "");
const dager = Array.from({ length: 24 }, (_, i) => i + 1);

describe("rampestrek: én kilde (historie §8 og §8.1)", () => {
  it("har 24 dager i §8, §8.1 og §4", () => {
    expect([lang.size, kort.size]).toEqual([24, 24]);
    expect(s4kol).toBeGreaterThan(0);
  });

  it.each(dager)("dag %i stemmer overalt", (n) => {
    const tekst = utenMerknad(lang.get(n)![2]);
    const [, tittel, tegnbar, sjekk] = kort.get(n)!;
    const q = getAllOppdrag().find((x) => x.dag === n)!;
    expect(q.rampenissen_rampestrek).toBe(tekst);
    expect(s4.get(n)![s4kol]).toBe(tekst);
    expect(
      radio.match(
        new RegExp(`^## Dag ${n} [\\s\\S]*?^\\*\\*Strek:\\*\\* (.+)$`, "m"),
      )?.[1],
    ).toBe(tegnbar);
    expect(
      kveldDag(n)!.sjekkliste.filter((l) => l.startsWith("Rampestrek: ")),
    ).toEqual([`Rampestrek: ${sjekk}`]);
    expect(strekTitler()[n - 1]).toBe(tittel);
    // The sharing sheet is shown around; no code word in its titles.
    const lekk = getAllOppdrag().filter((x) =>
      new RegExp(x.kode, "i").test(tittel),
    );
    expect(lekk.map((x) => x.kode)).toEqual([]);
  });
});

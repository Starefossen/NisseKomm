/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { RESERVESETT, kveldDag } from "../guide-sesong";
import { getAllOppdrag } from "../oppdrag";
import {
  UTSKRIFTER,
  utskriftTittel,
} from "@/app/nissemor-guide/printout/filer";

const FIL = /([\w-]+)\.pdf/g;
/** Words a parent reads: print files count as their title, ✱ and «_» don't count. */
const ord = (l: string) =>
  l
    .replace(FIL, (_, u) => utskriftTittel(u).replace(/ \(dag \d+\)$/, ""))
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

describe("kveldens sjekkliste (gaater-2026.md, feltet «Sjekkliste»)", () => {
  it.each(getAllOppdrag().map((q) => [q.dag, q.kode] as const))(
    "dag %i: 3–7 korte linjer uten koden",
    (n, kode) => {
      const linjer = kveldDag(n)!.sjekkliste;
      // Day 1 is the big build; its list may be longer.
      expect(linjer.length).toBeGreaterThanOrEqual(3);
      expect(linjer.length).toBeLessThanOrEqual(n === 1 ? 10 : 7);
      // Same rule as kodelekkasje.test.ts: digits as a whole number, words anywhere.
      // File names are left out: the guide shows their titles through «Vis fasit».
      const lekk = /^\d+$/.test(kode)
        ? new RegExp(`(?<!\\d)${kode}(?!\\d)`)
        : new RegExp(kode, "i");
      for (const l of linjer) {
        if (!(n === 1 && l.startsWith("Skriv ut")))
          expect([l, ord(l) <= 12]).toEqual([l, true]);
        expect(l.replace(FIL, "")).not.toMatch(lekk);
        for (const [, u] of l.matchAll(FIL))
          expect(UTSKRIFTER as readonly string[]).toContain(u);
      }
      expect(linjer[0]).toMatch(/^Skriv ut/);
      expect(linjer.filter((l) => l.startsWith("Rampestrek: "))).toHaveLength(
        1,
      );
    },
  );

  it("reservesett står bare der beslutningen 13.11 krever det", () => {
    for (let n = 1; n <= 24; n++) {
      const linje = kveldDag(n)!.sjekkliste.filter((l) =>
        l.startsWith("Skriv ut reservesett: "),
      );
      expect([n, linje.length]).toEqual([n, RESERVESETT[n] ? 1 : 0]);
      if (RESERVESETT[n]) expect(linje[0]).toContain(`${RESERVESETT[n]}.pdf`);
    }
  });
});

/**
 * Birk and Lyng say rampestrek_hint and utfordring_hint aloud on the day
 * itself, so they must carry nothing of that day's code: not the code (also
 * inside another word), and no letter or number from it standing alone.
 */
import { describe, it, expect } from "@jest/globals";
import radioHint from "@/data/radio-hint.json";
import { getAllOppdrag } from "@/lib/oppdrag";

const dag = radioHint.dag as Record<string, Record<string, string | undefined>>;
const alene = (t: string) =>
  new RegExp(`(?<![\\p{L}\\d])${t}(?![\\p{L}\\d])`, "iu");

describe("rampestrek_hint og utfordring_hint", () => {
  it.each(getAllOppdrag().map((q) => [q.dag, q.kode] as const))(
    "dag %i røper ingenting av koden",
    (d, kode) => {
      for (const felt of ["rampestrek_hint", "utfordring_hint"]) {
        const tekst = dag[d][felt];
        expect(tekst).toBeTruthy();
        expect(tekst!.toLowerCase()).not.toContain(kode.toLowerCase());
        // The preposition «i» is the one exception: bokmål cannot do without
        // it. A capital «I» alone still fails.
        const uten = tekst!.replace(/(?<![\p{L}\d])i(?![\p{L}\d])/gu, "");
        for (const tegn of new Set([...kode, kode]))
          expect(uten).not.toMatch(alene(tegn));
      }
    },
  );
});

/**
 * No kid-visible text may show a code before its day is solved.
 *
 * For each day d we collect every string a child can see on day d before
 * typing that day's code, and look for the codes of day d and all later days.
 * Text that only appears after day k is solved (PS, bonus reward, decrypted
 * files, milestones) counts from day k + 1.
 */
import { describe, it, expect } from "@jest/globals";
import { quests, visible } from "./synlig-tekst";

// app-tekster-2026.md C: «Landås» is the family's place name in texts on
// other days than 22 and is accepted there by design.
const ALLOWED = new Set(["LANDÅS"]);

// Locked texts that mention a later code in passing. Listed so a new leak
// still fails; each one is a question for Hans, not a fix.
const KNOWN = new Set<string>([]);

const pattern = (code: string) =>
  /^\d+$/.test(code)
    ? new RegExp(`(?<!\\d)${code}(?!\\d)`)
    : new RegExp(code, "i");

describe("kodelekkasje", () => {
  it.each(quests.map((q) => q.dag))(
    "dag %i: ingen synlig tekst viser dagens eller senere koder",
    (d) => {
      const codes = quests
        .filter((q) => q.dag >= d && !ALLOWED.has(q.kode))
        .map((q) => q.kode);
      const leaks = visible
        .filter((v) => v.from <= d)
        .flatMap((v) =>
          codes
            .filter((c) => pattern(c).test(v.text))
            .map((c) => `${c} i ${v.where}`)
            .filter((l) => !KNOWN.has(l)),
        );
      expect(leaks).toEqual([]);
    },
  );
});

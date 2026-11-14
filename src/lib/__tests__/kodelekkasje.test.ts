/**
 * No kid-visible text may show a code before its day is solved.
 *
 * For each day d we collect every string a child can see on day d before
 * typing that day's code, and look for the codes of day d and all later days.
 * Text that only appears after day k is solved (PS, bonus reward, decrypted
 * files, milestones) counts from day k + 1.
 */
import { describe, it, expect } from "@jest/globals";
import { alltid, quests, visible } from "./synlig-tekst";

// app-tekster-2026.md C: «Landås» is the family's place name in texts on
// other days than 22 and is accepted there by design.
const ALLOWED = new Set(["LANDÅS"]);

// Locked texts that mention a later code in passing. Listed so a new leak
// still fails; each one is a question for Hans, not a fix.
const KNOWN = new Set<string>([]);

// Inflected forms that do not contain the code as written. Related words of
// another class («sortere» for SORTERING) are everyday verbs and do not count.
const FORMER: Record<string, string[]> = {
  GULROT: ["gulrøt"],
  STJERNEKLART: ["stjerneklar"],
  KULDE: ["kulda"],
  TURBULENS: ["turbulent"],
};

// «Nord-lys» and «Nord\u00ADlys» read as one word
const norm = (s: string) =>
  s.replace(/(?<=\p{L})[-\u00AD\u2010\u2011](?=\p{L})/gu, "");

const pattern = (code: string) =>
  /^\d+$/.test(code)
    ? new RegExp(`(?<!\\d)${code}(?!\\d)`)
    : new RegExp([code, ...(FORMER[code] ?? [])].join("|"), "i");

const funn = (codes: string[], list: typeof visible) =>
  list.flatMap((v) =>
    codes
      .filter((c) => pattern(c).test(norm(v.text)))
      .map((c) => `${c} i ${v.where}`)
      .filter((l) => !KNOWN.has(l)),
  );

describe("kodelekkasje", () => {
  it.each(quests.map((q) => q.dag))(
    "dag %i: ingen synlig tekst viser dagens eller senere koder",
    (d) => {
      const codes = quests
        .filter((q) => q.dag >= d && !ALLOWED.has(q.kode))
        .map((q) => q.kode);
      expect(
        funn(
          codes,
          visible.filter((v) => v.from <= d),
        ),
      ).toEqual([]);
    },
  );

  // These open by date, so a child who has not solved an earlier day sees
  // them too: no code of any day, and no parent bonus code.
  it("navn og spilltekst som åpner på dato har ingen kode, uansett dag", () => {
    const codes = quests
      .flatMap((q) => [q.kode, q.bonusoppdrag?.foreldre_kode ?? ""])
      .filter((c) => /\D/.test(c) && !ALLOWED.has(c));
    expect([...new Set(funn(codes, alltid))]).toEqual([]);
  });
});

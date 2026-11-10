import { describe, it, expect } from "@jest/globals";
import { getAllOppdrag } from "@/lib/oppdrag";
import {
  TIDBITS,
  passwordOk,
  peekAllowed,
  rotate,
  secretReply,
  visible,
} from "@/lib/tidbits";

const HOUR = 3_600_000;

describe("tidbits", () => {
  it("shows an entry from fraDag through tilDag only", () => {
    const list = [
      { fraDag: 3, tekst: "a" },
      { fraDag: 5, tilDag: 6, tekst: "b" },
    ];
    expect(visible(list, 2)).toEqual([]);
    expect(visible(list, 3).map((t) => t.tekst)).toEqual(["a"]);
    expect(visible(list, 5).map((t) => t.tekst)).toEqual(["a", "b"]);
    expect(visible(list, 7).map((t) => t.tekst)).toEqual(["a"]);
    expect(rotate(list, 0, 2)).toBeNull();
    expect(rotate(list, 3, 5)).toBe("b");
  });

  it("every entry has a valid fraDag", () => {
    const all = [
      ...TIDBITS.idle.linjer,
      ...TIDBITS.terminal.hemmeligeOrd,
      ...TIDBITS.terminal.feilKode,
      ...TIDBITS.tv,
      ...TIDBITS.spam,
      ...TIDBITS.kalender,
      ...TIDBITS.stats,
      TIDBITS.musikk.skjultSpor,
      ...TIDBITS.nissenet.filer,
      ...TIDBITS.nissenet.feilPassord,
    ];
    for (const t of all) {
      expect(t.fraDag).toBeGreaterThanOrEqual(1);
      expect(t.fraDag).toBeLessThanOrEqual(t.tilDag ?? 24);
    }
  });

  it("matches secret words case-insensitively, gated by fraDag", () => {
    const [first] = TIDBITS.terminal.hemmeligeOrd;
    expect(secretReply(` ${first.ord[0].toLowerCase()} `, 24)).toBe(
      first.tekst,
    );
    expect(secretReply(first.ord[0], first.fraDag - 1)).toBeNull();
    expect(secretReply("IKKE-ET-ORD", 24)).toBeNull();
  });

  it("no secret word is a real or bonus code", () => {
    const codes = getAllOppdrag().flatMap((q) =>
      [q.kode, q.bonusoppdrag?.foreldre_kode]
        .filter((c): c is string => !!c)
        .map((c) => c.toUpperCase()),
    );
    const words = TIDBITS.terminal.hemmeligeOrd.flatMap((h) =>
      h.ord.map((o) => o.toUpperCase()),
    );
    expect(words.filter((w) => codes.includes(w))).toEqual([]);
  });

  it("checks NisseNet passwords case-insensitively", () => {
    const locked = TIDBITS.nissenet.filer.find((f) => f.passord)!;
    expect(passwordOk(locked.passord!, locked.passord!.toUpperCase())).toBe(
      true,
    );
    expect(passwordOk(locked.passord!, "feil")).toBe(false);
  });

  it("idle Rampenissen peeks at most once an hour", () => {
    expect(peekAllowed(null, 0)).toBe(true);
    expect(peekAllowed(1000, 1000 + HOUR - 1)).toBe(false);
    expect(peekAllowed(1000, 1000 + HOUR)).toBe(true);
  });
});

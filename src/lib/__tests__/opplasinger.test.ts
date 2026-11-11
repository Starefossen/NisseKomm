/** The unlock schedule must match each game's own gate, day by day. */
import { describe, it, expect } from "@jest/globals";
import {
  OPPLASINGER,
  nivaa,
  opplasingerPaaDag,
  puffTekst,
} from "../opplasinger";
import { KAPITLER, erLaastOpp } from "@/components/windows/nissespill/kapitler";
import { etapperFor } from "@/components/windows/snofall-tv/slede";
import { gamesFor } from "@/components/windows/snofall-tv/hud";
import { GameEngine } from "../game-engine";

const dager = Array.from({ length: 24 }, (_, i) => i + 1);
// Days on which a gate's open count grows
const nyeDager = (n: (d: number) => number) =>
  dager.filter((d) => n(d) > n(d - 1));
const planDager = (vindu: string) => [
  ...new Set(OPPLASINGER.filter((o) => o.vindu === vindu).map((o) => o.dag)),
];

describe("opplasinger", () => {
  it("Ugleposten: matches erLaastOpp", () => {
    expect(planDager("nissespill")).toEqual(
      nyeDager((d) => KAPITLER.filter((k) => erLaastOpp(k, d)).length),
    );
  });

  it("Sledeflukt: matches etapperFor", () => {
    expect(planDager("sledeflukt")).toEqual(
      nyeDager((d) => etapperFor(d).length),
    );
  });

  it("TEKNISK HUD: matches gamesFor (sleigh toy excluded)", () => {
    expect(planDager("nordpol_tv")).toEqual(
      nyeDager((d) => gamesFor(d).filter(([id]) => id !== "slede").length),
    );
  });

  it("modules: match getModuleUnlockDay", () => {
    for (const [m, v] of [
      ["NISSEKRYPTO", "nissekrypto"],
      ["SLEDEFLUKT", "sledeflukt"],
      ["NISSESTATS", "nissestats"],
    ]) {
      expect(
        opplasingerPaaDag(GameEngine.getModuleUnlockDay(m)!).some(
          (o) => o.vindu === v && !o.varsel,
        ),
      ).toBe(true);
    }
  });
});

describe("nivaa (escalation)", () => {
  const o = { dag: 10, vindu: "nissespill" as const, tekst: "x", varsel: "y" };
  const hud = { ...o, vindu: "nordpol_tv" as const, etterKode: true };
  it("quiet before the day, after opening and after three days", () => {
    expect(nivaa(o, 9, true, false)).toBe(0);
    expect(nivaa(o, 11, true, true)).toBe(0);
    expect(nivaa(o, 14, true, false)).toBe(0);
  });
  it("only the badge until today's code is in", () => {
    for (const d of [10, 11, 12, 13]) expect(nivaa(o, d, false, false)).toBe(1);
  });
  it("escalates after the code: ask, glow twice, last nudge", () => {
    expect([10, 11, 12, 13].map((d) => nivaa(o, d, true, false))).toEqual([
      2, 3, 3, 4,
    ]);
  });
  it("after-code items stay hidden on their day until the code", () => {
    expect(nivaa(hud, 10, false, false)).toBe(0);
    expect(nivaa(hud, 10, true, false)).toBe(2);
  });
  it("a sidebar line only for levels 2-4", () => {
    expect(puffTekst(o, 1)).toBeNull();
    expect(puffTekst(o, 2)).toMatch(/^RAMPENISSEN/);
    expect(puffTekst(o, 3)).toMatch(/^IQ/);
  });
});

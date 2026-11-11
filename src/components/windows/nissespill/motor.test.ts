import { describe, it, expect } from "@jest/globals";
import type { EventyrSave } from "@/lib/storage";
import * as M from "./motor";
import * as P from "./minispill";
import { KAPITLER } from "./kapitler";

const save = (...flags: string[]): EventyrSave => ({
  kapittel: 9,
  sceneId: "a",
  inventory: [],
  flags,
  hints: {},
});

describe("motor: vilkår", () => {
  const v: M.Vilkaar = {
    alle: [
      { hvis: "lampe" },
      { en_av: [{ hvis: "nokkel" }, { hvis: "kode" }] },
    ],
    uten: "ferdig",
  };
  it("alle og en_av kan nøstes, hvis/uten virker som før", () => {
    expect(M.ok(v, save("lampe"))).toBe(false);
    expect(M.ok(v, save("lampe", "kode"))).toBe(true);
    expect(M.ok(v, save("lampe", "nokkel", "ferdig"))).toBe(false);
    expect(M.ok({ hvis: "a" }, save("a"))).toBe(true);
    expect(M.ok({ en_av: [] }, save())).toBe(false);
  });
});

/** Tiny fixture: one example per engine feature. Not chapter content. */
const KAP: M.Kapittel = {
  n: 9,
  tittel: "Test",
  dag: 1,
  klar: true,
  start: "a",
  intro: [],
  slutt: "k9_slutt",
  utro: "",
  scener: [
    {
      id: "a",
      navn: "A",
      bilde: "",
      utganger: [],
      fjaer: { x: 30, y: 30, w: 3, h: 3 },
      hotspots: [
        {
          id: "skap",
          navn: "Skap",
          rect: { x: 0, y: 0, w: 20, h: 20 },
          smart: "bruk",
          se: "Et låst skap.",
          bruk: "Skapet er åpent.",
          puslespill: "skaplaas",
        },
      ],
    },
    { id: "b", navn: "B", bilde: "", utganger: [], hotspots: [] },
    {
      id: "c",
      navn: "C",
      bilde: "",
      utganger: [],
      fjaer: { x: 50, y: 80, w: 3, h: 3 },
      hotspots: [],
    },
  ],
  gjenstander: {},
  kombinasjoner: [],
  dialoger: {},
  gaater: [],
  fjaerBelonning: "Knerten blåser seg opp av stolthet.",
  puslespill: {
    skaplaas: {
      type: "laas",
      tittel: "Skaplås",
      flagg: "k9_skap",
      tekst: "Klikk!",
      hjul: [
        ["1", "2", "3"],
        ["A", "B", "C"],
      ],
      svar: ["3", "B"],
    },
    flis: { type: "skyv", tittel: "Fliser", flagg: "k9_flis", tekst: "" },
    radio: {
      type: "radio",
      tittel: "Radio",
      flagg: "k9_radio",
      tekst: "",
      min: 88,
      max: 108,
      maal: 101.5,
      toleranse: 0.3,
      steg: 0.1,
      enhet: "MHz",
    },
    ror: {
      type: "rute",
      tittel: "Rør",
      flagg: "k9_ror",
      tekst: "",
      rutenett: ["SL.", ".|.", ".LM"],
      start: [0, 0, 0, 0, 1, 0, 0, 0, 0],
    },
  },
};

describe("motor: minispill", () => {
  it("BRUK åpner puslespillet til det er løst, løsning setter flagget", () => {
    const h = KAP.scener[0].hotspots[0];
    const u = M.trykk(KAP, save(), h, null, null);
    expect(u.puslespill).toBe("skaplaas");
    const l = M.losPuslespill(KAP, u.save, "skaplaas");
    expect(M.has(l.save, "k9_skap")).toBe(true);
    expect(M.trykk(KAP, l.save, h, "bruk", null).tekst).toBe(
      "Skapet er åpent.",
    );
  });

  it("lås: hjul går rundt begge veier", () => {
    const p = KAP.puslespill!.skaplaas as P.PuslespillDef & { type: "laas" };
    let st = [0, 0];
    st = P.laasDrei(p, st, 0, -1);
    expect(st).toEqual([2, 0]);
    expect(P.laasApen(p, st)).toBe(false);
    expect(P.laasApen(p, P.laasDrei(p, st, 1, 1))).toBe(true);
  });

  it("skyv: stokking er alltid løsbar og aldri løst", () => {
    for (let seed = 1; seed < 200; seed++) {
      const st = P.skyvStokk(30, seed);
      expect(P.skyvLosbar(st)).toBe(true);
      expect(P.skyvLost(st)).toBe(false);
    }
    expect(P.skyvLosbar([1, 0, 2, 3, 4, 5, 6, 7, 8])).toBe(false);
    const nesten = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    expect(P.skyvFlytt(nesten, 0)).toBe(nesten);
    expect(P.skyvLost(P.skyvFlytt(nesten, 8))).toBe(true);
  });

  it("radio: signal topper på målet", () => {
    const p = KAP.puslespill!.radio as P.PuslespillDef & { type: "radio" };
    expect(P.radioSignal(p, 101.5)).toBe(1);
    expect(P.radioSignal(p, 90)).toBe(0);
    expect(P.radioSignal(p, 100)).toBeGreaterThan(P.radioSignal(p, 99));
    expect(P.radioInne(p, 101.7)).toBe(true);
    expect(P.radioInne(p, 102)).toBe(false);
  });

  it("rute: gyldig, kobles ved riktig dreiing, ugyldige rutenett avvises", () => {
    const p = KAP.puslespill!.ror as P.PuslespillDef & { type: "rute" };
    expect(P.ruteFeil(p)).toEqual([]);
    // L at (0,1) turned to W+S, | upright, L at (2,1) turned to N+E
    expect(P.ruteKoblet(p, [0, 2, 0, 0, 0, 0, 0, 0, 0])).toBe(true);
    expect(P.ruteKoblet(p, p.start!)).toBe(false);
    expect(P.ruteFeil({ rutenett: ["S.M"] })).toEqual(["kan ikke løses"]);
    expect(P.ruteFeil({ rutenett: ["S+M"] })).toEqual(["er løst fra start"]);
    expect(P.ruteFeil({ rutenett: ["S|", "M"] }).length).toBeGreaterThan(0);
    expect(P.ruteFeil({ rutenett: ["S|X"] }).length).toBeGreaterThan(0);
  });
});

describe("motor: fjær", () => {
  it("gamle lagringer uten fjaer laster, SE plukker, siste gir belønning", () => {
    let s = save();
    expect(M.fjaerTelling(KAP, s)).toEqual([0, 2]);
    expect(M.taFjaer(KAP, s, "a", "bruk").save).toBe(s);
    s = M.taFjaer(KAP, s, "a", "se").save;
    expect(M.fjaerTelling(KAP, s)).toEqual([1, 2]);
    expect(M.taFjaer(KAP, s, "a", null).save).toBe(s);
    const u = M.taFjaer(KAP, s, "c", null);
    expect(u.tekst).toContain("Fjær 2/2. Knerten");
    expect(M.nyttKapittel(KAP, u.save).fjaer).toEqual(["9:a", "9:c"]);
  });
});

describe("motor: notatbok", () => {
  const k1 = KAPITLER[0];
  it("viser løste mål, det første uløste og kjente parallelle mål", () => {
    const fersk = M.notater(k1, M.nyttKapittel(k1));
    expect(fersk.map((n) => n.gjort)).toEqual([false]);
    expect(fersk[0].tekst).toContain("garnkurven");
    const etter = M.notater(k1, save("winter_snakket"));
    expect(etter.map((n) => [n.gjort, n.tekst.split(" ")[0]])).toEqual([
      [true, "Finn"],
      [false, "Gjør"],
      [false, "Få"],
    ]);
  });

  it.each(KAPITLER.map((k) => [k.n, k] as const))(
    "kapittel %i: hvert mål har notat, og notatene er unike",
    (_, k) => {
      const maal = k.gaater.map((g) => g.maal ?? "");
      expect(maal.every(Boolean)).toBe(true);
      expect(new Set(maal).size).toBe(maal.length);
    },
  );
});

describe("motor: kapitlenes minispill er gyldige", () => {
  it.each([KAP, ...KAPITLER].map((k) => [k.n, k] as const))(
    "kapittel %i",
    (_, k) => {
      const ider = Object.keys(k.puslespill ?? {});
      const overlapper = (a: M.Rect, b: M.Rect) =>
        a.x < b.x + b.w &&
        b.x < a.x + a.w &&
        a.y < b.y + b.h &&
        b.y < a.y + a.h;
      for (const s of k.scener) {
        for (const h of s.hotspots) {
          if (h.puslespill) expect(ider).toContain(h.puslespill);
          // A feather under a hotspot could never be tapped
          if (s.fjaer) expect(overlapper(s.fjaer, h.rect)).toBe(false);
        }
      }
      for (const p of Object.values(k.puslespill ?? {})) {
        if (p.type === "rute") expect(P.ruteFeil(p)).toEqual([]);
        if (p.type === "laas") {
          expect(p.svar.length).toBe(p.hjul.length);
          p.svar.forEach((x, i) => expect(p.hjul[i]).toContain(x));
          expect(
            P.laasApen(
              p,
              p.hjul.map(() => 0),
            ),
          ).toBe(false);
        }
        if (p.type === "radio") {
          expect(p.maal).toBeGreaterThan(p.min);
          expect(p.maal).toBeLessThan(p.max);
        }
      }
    },
  );
});

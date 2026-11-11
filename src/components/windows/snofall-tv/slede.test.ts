import { describe, it, expect, beforeEach } from "@jest/globals";
import { GameEngine } from "@/lib/game-engine";
import {
  ALT_CRUISE,
  bjelleKrav,
  bjeller,
  createSim,
  ETAPPER,
  etapperFor,
  forutsiPakke,
  FRI_SLUTT,
  HUS_PIPE,
  lagBane,
  landemerker,
  LEVERING_BONUS,
  leveringsoppdrag,
  nesteLandemerke,
  pakkenavn,
  RAMP,
  rekkeMult,
  UTFORDRING_BONUS,
  utfordringKlart,
  utfordringStatus,
} from "./slede";
import { dagensUtfordring } from "./slede";

const still = { steer: 0, climb: 0, sprang: false };

/** Runs a stage to the end with a fixed input, returning the sim. */
function fly(
  id: (typeof ETAPPER)[number]["id"],
  assist: boolean,
  reduceMotion = false,
) {
  const e = ETAPPER.find((x) => x.id === id)!;
  const sim = createSim(e, { assist, reduceMotion });
  for (let i = 0; i < 20000 && !sim.s.ferdig && !sim.s.tapt; i++) {
    sim.step(1 / 60, still);
  }
  return sim;
}

describe("etapper", () => {
  it("opens new stages from 8 December; story days 20, 21, 24", () => {
    expect(ETAPPER.map((e) => e.dag)).toEqual([
      8, 9, 12, 14, 18, 19, 20, 21, 24,
    ]);
    const ids = (d: number) => etapperFor(d).map((e) => e.id);
    expect(ids(7)).toEqual([]);
    expect(ids(8)).toEqual(["tundra"]);
    expect(ids(9)).toEqual(["tundra", "vardeloypa"]);
    expect(ids(17)).toHaveLength(4);
    expect(ids(19)).toHaveLength(6);
    expect(ids(20)).toContain("nordtoppen");
    expect(ids(21)).toContain("muren");
    expect(ids(23)).not.toContain("julenatt");
    expect(ids(24)).toHaveLength(ETAPPER.length);
  });

  it("gets harder stage by stage: faster, longer, never a slower later stage", () => {
    // Six progression stages speed up one by one; the story stages are at least as fast
    // (the fog stage is tuned a notch down because the draw distance is short).
    const fart = ETAPPER.map((e) => e.fart);
    for (let i = 1; i < 6; i++)
      expect(fart[i]).toBeGreaterThanOrEqual(fart[i - 1]);
    for (let i = 6; i < fart.length; i++)
      expect(fart[i]).toBeGreaterThanOrEqual(fart[5]);
    const trær = (id: string) =>
      lagBane(ETAPPER.find((e) => e.id === id)!).filter((t) => t.type === "tre")
        .length;
    expect(trær("granskogen")).toBeGreaterThan(trær("tundra") * 1.5);
    const bane = (id: string) => lagBane(ETAPPER.find((e) => e.id === id)!);
    expect(
      bane("vardeloypa").filter((t) => t.type === "varde").length,
    ).toBeGreaterThan(bane("tundra").filter((t) => t.type === "varde").length);
    expect(bane("tindeflukten").some((t) => t.type === "topp")).toBe(true);
    expect(
      bane("kastevind").filter((t) => t.type === "vind").length,
    ).toBeGreaterThan(bane("tundra").filter((t) => t.type === "vind").length);
  });

  it("builds the same course every time, sorted by distance, within reach", () => {
    for (const e of ETAPPER) {
      const a = lagBane(e);
      expect(a).toEqual(lagBane(e));
      expect(a.every((t, i) => i === 0 || t.z >= a[i - 1].z)).toBe(true);
      expect(a.filter((t) => t.type === "varde").length).toBeGreaterThan(20);
      expect(a.every((t) => t.type !== "tre" || Math.abs(t.x) <= 1.25)).toBe(
        true,
      );
    }
    const av = (id: string) => lagBane(ETAPPER.find((e) => e.id === id)!);
    expect(av("muren").filter((t) => t.type === "mur")).toHaveLength(3);
    expect(av("julenatt").some((t) => t.type === "grotte")).toBe(true);
    expect(av("nordtoppen").some((t) => t.type === "band")).toBe(true);
  });
});

describe("sim", () => {
  it("assist mode always reaches the finish, never game over", () => {
    for (const e of ETAPPER) {
      const sim = fly(e.id, true);
      expect(sim.s.ferdig).toBe(true);
      expect(sim.s.tapt).toBe(false);
      expect(sim.s.liv).toBe(Infinity);
    }
  });

  it("assist holds cruise altitude when the stick is untouched", () => {
    const sim = createSim(ETAPPER[0], { assist: true, reduceMotion: false });
    sim.step(0.5, { ...still, climb: 1 });
    expect(sim.s.alt).toBeGreaterThan(ALT_CRUISE);
    for (let i = 0; i < 300; i++) sim.step(1 / 60, still);
    expect(Math.abs(sim.s.alt - ALT_CRUISE)).toBeLessThan(2);
  });

  it("pilot mode loses a life per crash and ends after three", () => {
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const tre = sim.s.ting.find(
      (t) => t.type === "tre" && Math.abs(t.x) < 0.9,
    )!;
    sim.s.px = tre.x;
    sim.s.dist = tre.z - 1;
    sim.s.alt = 60;
    sim.s.first = sim.s.ting.indexOf(tre);
    expect(sim.step(1 / 60, still)).toContain("krasj");
    expect(sim.s.liv).toBe(2);
    sim.step(1 / 60, still);
    expect(sim.s.fart).toBeLessThan(ETAPPER[0].fart * 0.5);
  });

  it("scores a beacon when passing through its ring", () => {
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const v = sim.s.ting.find((t) => t.type === "varde")!;
    sim.s.px = v.x;
    sim.s.dist = v.z - 1;
    expect(sim.step(1 / 60, still)).toContain("bjelle");
    expect(sim.s.poeng).toBe(150);
    expect(sim.s.varder).toBe(1);
    expect(sim.s.kraft).toBe(0.25);
  });

  it("steering has inertia and the course speeds up towards the finish", () => {
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    sim.step(1 / 60, { ...still, steer: 1 });
    const nudge = sim.s.px;
    expect(nudge).toBeGreaterThan(0);
    expect(nudge).toBeLessThan(1.9 / 60 / 2);
    for (let i = 0; i < 30; i++) sim.step(1 / 60, { ...still, steer: 1 });
    expect(sim.s.vx).toBeGreaterThan(1.8);
    const start = sim.s.fart;
    sim.s.dist = ETAPPER[0].lengde - 10;
    sim.step(1 / 600, still);
    expect(sim.s.fart / start).toBeCloseTo(1 + RAMP, 1);
  });

  it("reduced motion flies slower and still finishes", () => {
    const fast = fly("tundra", true);
    const slow = fly("tundra", true, true);
    expect(slow.s.ferdig).toBe(true);
    expect(slow.s.tid).toBeGreaterThan(fast.s.tid * 1.2);
  });

  it("bells: 40 % one, 70 % two, 90 % and no crash three", () => {
    expect(bjelleKrav(10)).toEqual([4, 7, 9]);
    expect(bjelleKrav(61)).toEqual([25, 43, 55]);
    expect(bjeller(0, 0, 0)).toBe(0);
    expect(bjeller(3, 10, 0)).toBe(0);
    expect(bjeller(4, 10, 2)).toBe(1);
    expect(bjeller(7, 10, 1)).toBe(2);
    expect(bjeller(9, 10, 1)).toBe(2);
    expect(bjeller(9, 10, 0)).toBe(3);
  });
});

describe("GameEngine.recordSledeResultat", () => {
  beforeEach(() => localStorage.clear());

  it("keeps one whole run per stage: most bells, then most points", () => {
    expect(GameEngine.getSledeResultater()).toEqual({});
    GameEngine.recordSledeResultat("tundra", 800, 2);
    GameEngine.recordSledeResultat("tundra", 500, 3);
    GameEngine.recordSledeResultat("tundra", 2000, 0);
    GameEngine.recordSledeResultat("muren", 1200, 1);
    expect(GameEngine.getSledeResultater()).toEqual({
      tundra: { poeng: 500, bjeller: 3 },
      muren: { poeng: 1200, bjeller: 1 },
    });
  });
});

describe("rekke og nære på", () => {
  it("multiplies beacons after 3, 6 and 9 in a row, and a miss resets", () => {
    expect([0, 2, 3, 5, 6, 9, 30].map(rekkeMult)).toEqual([
      1, 1, 2, 2, 3, 4, 4,
    ]);
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const varder = sim.s.ting.filter((t) => t.type === "varde");
    for (let i = 0; i < 4; i++) {
      sim.s.px = varder[i].x;
      sim.s.dist = varder[i].z - 1;
      sim.s.first = sim.s.ting.indexOf(varder[i]);
      sim.step(1 / 60, still);
    }
    expect(sim.s.rekke).toBe(4);
    // Fourth beacon paid double (x2 from the third onwards).
    expect(sim.s.poeng).toBe(150 * 3 + 300);
    sim.s.px = varder[4].x + 1;
    sim.s.dist = varder[4].z - 1;
    sim.s.first = sim.s.ting.indexOf(varder[4]);
    expect(sim.step(1 / 60, still)).toContain("bom");
    expect(sim.s.rekke).toBe(0);
    expect(sim.s.besteRekke).toBe(4);
  });

  it("rewards skimming a tree without hitting it", () => {
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const tre = sim.s.ting.find(
      (t) => t.type === "tre" && Math.abs(t.x) < 0.9,
    )!;
    sim.s.px = tre.x + 0.3;
    sim.s.dist = tre.z - 1;
    sim.s.alt = 60;
    sim.s.first = sim.s.ting.indexOf(tre);
    expect(sim.step(1 / 60, still)).toContain("nære");
    expect(sim.s.nære).toBe(1);
    expect(sim.s.poeng).toBe(40);
    expect(sim.s.liv).toBe(3);
  });
});

describe("dagens utfordring", () => {
  it("cycles through six kinds with the date, scaled to the stage", () => {
    const typer = Array.from(
      { length: 6 },
      (_, i) => dagensUtfordring(8 + i, ETAPPER[0]).type,
    );
    expect(new Set(typer).size).toBe(6);
    expect(dagensUtfordring(8, ETAPPER[0])).toEqual(
      dagensUtfordring(8, ETAPPER[0]),
    );
    expect(dagensUtfordring(14, ETAPPER[0]).type).toBe(
      dagensUtfordring(8, ETAPPER[0]).type,
    );
    const muren = ETAPPER.find((e) => e.id === "muren")!;
    for (let d = 21; d < 27; d++)
      expect(dagensUtfordring(d, muren).type).not.toBe("stjerner");
    for (const e of ETAPPER)
      for (let d = e.dag; d <= 24; d++) {
        const u = dagensUtfordring(d, e);
        expect(u.tekst).not.toMatch(/(?<!\d)(24|75)(?!\d)/);
        expect(u.bonus).toBe(UTFORDRING_BONUS);
      }
  });

  it("pays the bonus at the finish line when the challenge is met", () => {
    const e = ETAPPER[0];
    const ren = { type: "renflyging", mål: 0, tekst: "", bonus: 500 } as const;
    // Hands off the stick: the finish is certain, so the time target is what is tested.
    const sim = createSim(e, {
      assist: true,
      reduceMotion: false,
      utfordring: { ...ren, type: "tid", mål: 9999 },
    });
    let ev: string[] = [];
    for (let i = 0; i < 20000 && !sim.s.ferdig; i++)
      ev = ev.concat(sim.step(1 / 60, still));
    expect(sim.s.utfordringKlart).toBe(true);
    expect(sim.s.poeng).toBeGreaterThanOrEqual(500);
    expect(ev).toContain("utfordring");
    const telling = {
      varder: 5,
      krasj: 1,
      stjerner: 2,
      tid: 48,
      besteRekke: 4,
      nære: 0,
    };
    expect(utfordringKlart({ ...ren, type: "varder", mål: 5 }, telling)).toBe(
      true,
    );
    expect(utfordringKlart({ ...ren, type: "varder", mål: 6 }, telling)).toBe(
      false,
    );
    expect(utfordringKlart(ren, telling)).toBe(false);
    expect(utfordringKlart({ ...ren, type: "tid", mål: 50 }, telling)).toBe(
      true,
    );
    expect(utfordringKlart({ ...ren, type: "rekke", mål: 6 }, telling)).toBe(
      false,
    );
    expect(utfordringStatus({ ...ren, type: "tid", mål: 50 }, telling)).toBe(
      "48 s / 50",
    );
    expect(utfordringStatus(ren, telling)).toBe("KRASJ");
  });
});

describe("pipelevering", () => {
  it("puts smoking houses within reach on stages from day 14 only", () => {
    for (const e of ETAPPER) {
      const hus = lagBane(e).filter((t) => t.type === "hus");
      if (e.dag < 14) expect(hus).toHaveLength(0);
      else {
        expect(hus.length).toBeGreaterThan(3);
        for (const h of hus) {
          expect(Math.abs(h.x)).toBeLessThanOrEqual(1);
          expect(HUS_PIPE).toContain(h.h);
        }
      }
    }
  });

  it("drops one package at a time; the preview lands where the package lands", () => {
    const e = ETAPPER.find((x) => x.id === "stjernedrysset")!;
    const sim = createSim(e, { assist: true, reduceMotion: false });
    const hus = sim.s.ting.find((t) => t.type === "hus")!;
    sim.s.px = hus.x;
    sim.s.dist = hus.z - 3000;
    sim.step(1 / 60, still);
    // Fly until the preview crosses the chimney, then drop.
    for (let i = 0; i < 2000 && !sim.s.pakke; i++) {
      const bane = forutsiPakke(sim.s, 0);
      const ved = bane.find((p) => Math.abs(p.z - hus.z) < 60);
      const treff = !!ved && ved.alt <= hus.h && ved.alt > hus.h - 45;
      const ev = sim.step(1 / 60, { ...still, slipp: treff });
      if (treff) expect(ev).toContain("slipp");
    }
    expect(sim.s.pakke).not.toBeNull();
    expect(sim.step(1 / 60, { ...still, slipp: true })).not.toContain("slipp");
    let ev: string[] = [];
    for (let i = 0; i < 600 && sim.s.pakke; i++)
      ev = ev.concat(sim.step(1 / 60, still));
    expect(ev).toContain("levering");
    expect(sim.s.pakker).toBe(1);
    expect(hus.treff).toBe(true);
    expect(sim.s.poeng).toBeGreaterThanOrEqual(200);
  });

  it("a package dropped over nothing lands in the snow", () => {
    const e = ETAPPER.find((x) => x.id === "stjernedrysset")!;
    const sim = createSim(e, { assist: true, reduceMotion: false });
    let ev: string[] = sim.step(1 / 60, { ...still, slipp: true });
    for (let i = 0; i < 600 && sim.s.pakke; i++)
      ev = ev.concat(sim.step(1 / 60, still));
    expect(ev).toContain("slipp");
    expect(ev).toContain("pakkebom");
    expect(sim.s.pakkebom).toBe(1);
    expect(sim.s.pakker).toBe(0);
  });

  it("names packages after the kids' letters, generic sacks without", () => {
    expect(pakkenavn([], 0)).toBe("PAKKE FRA HJERTERUD");
    expect(pakkenavn([], 5)).toBe("PAKKE FRA IQ");
    const brev = [
      { from: "Håkon" },
      { from: "Kristian" },
      { from: "Håkon" },
      { from: "" },
    ];
    expect(pakkenavn(brev, 0)).toBe("PAKKE TIL HÅKON");
    expect(pakkenavn(brev, 1)).toBe("PAKKE TIL KRISTIAN");
    expect(pakkenavn(brev, 2)).toBe("PAKKE TIL HÅKON");
  });

  it("the delivery mission scales with the houses and pays at the finish", () => {
    expect(leveringsoppdrag(14, ETAPPER[0])).toBeNull();
    const e = ETAPPER.find((x) => x.id === "julenatt")!;
    const hus = lagBane(e).filter((t) => t.type === "hus").length;
    for (let d = 14; d <= 24; d++) {
      const l = leveringsoppdrag(d, e)!;
      expect(l.mål).toBeGreaterThan(0);
      expect(l.mål).toBeLessThanOrEqual(hus);
      expect(l.tekst).not.toMatch(/(?<!\d)(24|75)(?!\d)/);
      expect(l.bonus).toBe(LEVERING_BONUS);
    }
    const sim = createSim(e, {
      assist: true,
      reduceMotion: false,
      levering: { mål: 1, tekst: "", bonus: LEVERING_BONUS },
    });
    sim.s.pakker = 1;
    let ev: string[] = [];
    for (let i = 0; i < 20000 && !sim.s.ferdig; i++)
      ev = ev.concat(sim.step(1 / 60, still));
    expect(ev).toContain("leveringKlart");
    expect(sim.s.leveringKlart).toBe(true);
  });
});

describe("fri flyging", () => {
  it("never finishes: past the farms it loops back to Snøfall with the course reset", () => {
    const e = ETAPPER[0];
    const sim = createSim(e, { assist: true, reduceMotion: false, fri: true });
    let runder = 0;
    let maks = 0;
    for (let i = 0; i < 20000; i++) {
      const ev = sim.step(1 / 60, still);
      if (ev.includes("runde")) runder++;
      maks = Math.max(maks, sim.s.dist);
    }
    expect(sim.s.ferdig).toBe(false);
    expect(runder).toBeGreaterThanOrEqual(1);
    expect(maks).toBeGreaterThan(e.lengde + FRI_SLUTT - 100);
    expect(sim.s.dist).toBeLessThan(e.lengde);
    expect(sim.s.ting.every((t) => !t.ferdig || t.z <= sim.s.dist)).toBe(true);
  });

  it("names the landmarks in course order and points at the next one", () => {
    const julenatt = ETAPPER.find((x) => x.id === "julenatt")!;
    const l = landemerker(julenatt);
    expect(l[0]).toEqual({ z: 0, navn: "SNØFALL" });
    expect(l.map((x) => x.navn)).toContain("GROTTEN");
    expect(l[l.length - 1].navn).toBe("LANDÅS");
    for (let i = 1; i < l.length; i++)
      expect(l[i].z).toBeGreaterThan(l[i - 1].z);
    expect(nesteLandemerke(julenatt, -1200)).toBe("SNØFALL 1,2 KM");
    expect(nesteLandemerke(julenatt, julenatt.lengde + 100)).toMatch(
      /^SNØFALL \d+,\d KM$/,
    );
    const muren = ETAPPER.find((x) => x.id === "muren")!;
    expect(landemerker(muren).map((x) => x.navn)).toContain("MUREN");
    expect(landemerker(ETAPPER[0]).map((x) => x.navn)).toEqual([
      "SNØFALL",
      "TUNDRA-TESTEN",
      "GÅRDENE",
    ]);
  });
});

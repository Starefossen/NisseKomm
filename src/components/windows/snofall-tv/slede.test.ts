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
  HUS_PIPE,
  lagBane,
  LEVERING_BONUS,
  leveringsoppdrag,
  pakkenavn,
  nærPoeng,
  landingTekst,
  PIPE_POENG,
  NÆR_M,
  RADIO,
  radiolinje,
  RAMP,
  rekkeMult,
  KLATRE,
  RING_ALT,
  RING_X,
  ringAvvik,
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

  it("scores a ring when flying through its centre", () => {
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const v = sim.s.ting.find((t) => t.type === "varde")!;
    sim.s.px = v.x;
    sim.s.alt = v.h;
    sim.s.dist = v.z - 1;
    expect(sim.step(1 / 60, still)).toContain("bjelle");
    expect(sim.s.poeng).toBe(150);
    expect(sim.s.varder).toBe(1);
    expect(sim.s.kraft).toBe(0.25);
  });

  it("rings hang at an altitude: too high or too low is a near miss, then a miss", () => {
    const ved = (dAlt: number, dx = 0) => {
      const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
      const v = sim.s.ting.find((t) => t.type === "varde")!;
      sim.s.px = v.x + dx;
      sim.s.alt = v.h + dAlt;
      sim.s.dist = v.z - 1;
      return [sim.step(1 / 60, still), sim.s.poeng] as const;
    };
    expect(ringAvvik(RING_X, 120, { x: 0, h: 120, z: 0, type: "varde" })).toBe(
      1,
    );
    expect(ved(RING_ALT * 0.8)[0]).toContain("bjelle");
    expect(ved(RING_ALT * 0.8)[1]).toBe(100);
    expect(ved(RING_ALT * 1.3)[0]).toContain("nesten");
    expect(ved(RING_ALT * 1.3)[1]).toBe(0);
    expect(ved(0, RING_X * 2.5)[0]).toContain("bom");
    // The assistant's wider ring forgives a little more.
    const sim = createSim(ETAPPER[0], { assist: true, reduceMotion: false });
    const v = sim.s.ting.find((t) => t.type === "varde")!;
    sim.s.px = v.x;
    sim.s.alt = v.h + RING_ALT * 1.3;
    sim.s.dist = v.z - 1;
    expect(sim.step(1 / 60, still)).toContain("bjelle");
  });

  it("ring altitudes vary within reach: gentle on day 8, wider later, every step climbable", () => {
    const spenn = new Map<string, number>();
    for (const e of ETAPPER) {
      const ringer = lagBane(e).filter((t) => t.type === "varde");
      const h = ringer.map((t) => t.h);
      expect(Math.min(...h)).toBeGreaterThanOrEqual(110);
      expect(Math.max(...h)).toBeLessThanOrEqual(400);
      spenn.set(e.id, Math.max(...h) - Math.min(...h));
      for (let i = 1; i < ringer.length; i++) {
        const sek = (ringer[i].z - ringer[i - 1].z) / (e.fart * (1 + RAMP));
        const steg = Math.abs(ringer[i].h - ringer[i - 1].h);
        expect(steg).toBeLessThanOrEqual(KLATRE * sek);
        // Every pair needs a real climb or dive: the next ring is out of the current one's opening.
        expect(steg).toBeGreaterThan(RING_ALT * 0.9);
      }
    }
    expect(spenn.get("tundra")!).toBeGreaterThan(40);
    expect(spenn.get("tundra")!).toBeLessThan(spenn.get("julenatt")!);
    expect(spenn.get("tundra")!).toBeLessThan(spenn.get("stjernedrysset")!);
  });

  it("day 8 teaches low then high, and every stage teases the next one locked out of reach", () => {
    const [a, b] = lagBane(ETAPPER[0]).filter((t) => t.type === "varde");
    expect(a.h).toBeLessThan(ALT_CRUISE);
    expect(b.h).toBeGreaterThan(ALT_CRUISE);
    for (let i = 0; i + 1 < ETAPPER.length; i++) {
      const teaser = lagBane(ETAPPER[i]).filter(
        (t) => t.type === "topp" && t.lås === ETAPPER[i + 1].dag,
      );
      expect(teaser).toHaveLength(2);
      for (const t of teaser) expect(Math.abs(t.x)).toBeGreaterThan(1.75);
    }
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

  it("keeps a best per player beside the family's, with the day the challenge was cleared", () => {
    expect(GameEngine.recordSledeResultat("tundra", 800, 2, "Håkon")).toEqual({
      poeng: 800,
      bjeller: 2,
    });
    GameEngine.recordSledeResultat("tundra", 1500, 1, "Kristian", 9);
    // A worse run that clears today's challenge keeps the best but notes the day.
    expect(
      GameEngine.recordSledeResultat("tundra", 100, 0, "Håkon", 10),
    ).toEqual({ poeng: 800, bjeller: 2, utfordringDag: 10 });
    expect(GameEngine.getSledeResultaterFor("Håkon")).toEqual({
      tundra: { poeng: 800, bjeller: 2, utfordringDag: 10 },
    });
    expect(GameEngine.getSledeResultaterFor("Kristian").tundra.poeng).toBe(
      1500,
    );
    expect(GameEngine.getSledeResultaterFor(null)).toEqual({});
    expect(GameEngine.getSledeResultater().tundra).toEqual({
      poeng: 800,
      bjeller: 2,
    });
    GameEngine.setSledeSpiller("Håkon");
    expect(GameEngine.getSledeSpiller()).toBe("Håkon");
  });
});

describe("rekke og nære på", () => {
  it("multiplies rings after 3, 6 and 9 in a row, and a miss resets", () => {
    expect([0, 2, 3, 5, 6, 9, 30].map(rekkeMult)).toEqual([
      1, 1, 2, 2, 3, 4, 4,
    ]);
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const varder = sim.s.ting.filter((t) => t.type === "varde");
    for (let i = 0; i < 4; i++) {
      sim.s.px = varder[i].x;
      sim.s.alt = varder[i].h;
      sim.s.dist = varder[i].z - 1;
      sim.s.first = sim.s.ting.indexOf(varder[i]);
      sim.step(1 / 60, still);
    }
    expect(sim.s.rekke).toBe(4);
    // Fourth beacon paid double (x2 from the third onwards).
    expect(sim.s.poeng).toBe(150 * 3 + 300);
    sim.s.px = varder[4].x > 0 ? varder[4].x - 1 : varder[4].x + 1;
    sim.s.alt = varder[4].h;
    sim.s.dist = varder[4].z - 1;
    sim.s.first = sim.s.ting.indexOf(varder[4]);
    expect(sim.step(1 / 60, still)).toContain("bom");
    expect(sim.s.rekke).toBe(0);
    expect(sim.s.besteRekke).toBe(4);
  });

  it("catches a letter bird at its altitude for a bonus and a little boost", () => {
    for (const e of ETAPPER) {
      const fugler = lagBane(e).filter((t) => t.type === "fugl");
      expect(fugler.length).toBeGreaterThanOrEqual(2);
      for (const f of fugler) {
        expect(Math.abs(f.x)).toBeLessThanOrEqual(1);
        expect(f.h).toBeGreaterThanOrEqual(100);
        expect(f.h).toBeLessThanOrEqual(210);
      }
    }
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const f = sim.s.ting.find((t) => t.type === "fugl")!;
    sim.s.px = f.x;
    sim.s.alt = f.h + 100;
    sim.s.dist = f.z - 1;
    sim.s.first = sim.s.ting.indexOf(f);
    expect(sim.step(1 / 60, still)).not.toContain("fugl");
    f.ferdig = false;
    sim.s.alt = f.h;
    sim.s.dist = f.z - 1;
    sim.s.first = sim.s.ting.indexOf(f);
    expect(sim.step(1 / 60, still)).toContain("fugl");
    expect(sim.s.fugler).toBe(1);
    expect(sim.s.poeng).toBe(80);
    expect(sim.s.kraft).toBeCloseTo(0.15);
    expect(radiolinje("fugl", 0)).toMatch(/brevfugl/i);
    expect(radiolinje("fugl", 3)).toBe(radiolinje("fugl", 0));
    expect(radiolinje("stjerne", 0)).toBeNull();
    for (const l of Object.values(RADIO).flat())
      expect(l.length).toBeLessThan(70);
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

  it("close landings score by distance, and per house only an improvement counts", () => {
    expect(nærPoeng(0)).toBe(PIPE_POENG);
    expect(nærPoeng(15)).toBe(PIPE_POENG / 2);
    expect(nærPoeng(NÆR_M)).toBe(0);
    expect(landingTekst(0)).toBe("RETT I PIPA!");
    expect(landingTekst(3.24)).toBe("3,2 m fra pipa");
    const e = ETAPPER.find((x) => x.id === "stjernedrysset")!;
    const sim = createSim(e, { assist: true, reduceMotion: false });
    const hus = sim.s.ting.find((t) => t.type === "hus")!;
    const land = (dx: number) => {
      sim.s.pakke = {
        x: hus.x + dx / 45,
        alt: 0.1,
        z: hus.z,
        vx: 0,
        vy: -10,
        vz: 0,
      };
      return sim.step(1 / 60, still);
    };
    expect(land(15)).toContain("nærLevering");
    expect(sim.s.sisteMeter).toBeCloseTo(15, 0);
    expect(hus.nær).toBeGreaterThan(80);
    const etter = sim.s.poeng;
    land(20);
    expect(sim.s.poeng).toBe(etter);
    const før = hus.nær!;
    land(6);
    expect(hus.nær).toBe(nærPoeng(6));
    expect(sim.s.poeng - etter).toBe(nærPoeng(6) - før);
    expect(land(40)).toContain("pakkebom");
    expect(sim.s.pakker).toBe(0);
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

  it("diving into the snow is a crash without the assistant, never with it", () => {
    const ned = { steer: 0, climb: -1, sprang: false };
    const sim = createSim(ETAPPER[0], { assist: false, reduceMotion: false });
    const ev: string[] = [];
    for (let i = 0; i < 180; i++) ev.push(...sim.step(1 / 60, ned));
    expect(ev).toContain("krasj");
    expect(sim.s.liv).toBeLessThan(3);
    const trygg = createSim(ETAPPER[0], { assist: true, reduceMotion: false });
    for (let i = 0; i < 180; i++)
      expect(trygg.step(1 / 60, ned)).not.toContain("krasj");
  });
});

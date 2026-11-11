import { describe, it, expect, beforeEach } from "@jest/globals";
import { GameEngine } from "@/lib/game-engine";
import {
  ALT_CRUISE,
  bjeller,
  createSim,
  ETAPPER,
  etapperFor,
  lagBane,
  rekkeMult,
} from "./slede";

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
  it("opens one stage per storyboard day: 18, 20, 21, 24", () => {
    const ids = (d: number) => etapperFor(d).map((e) => e.id);
    expect(ids(17)).toEqual([]);
    expect(ids(18)).toEqual(["tundra"]);
    expect(ids(19)).toEqual(["tundra"]);
    expect(ids(20)).toEqual(["tundra", "nordtoppen"]);
    expect(ids(21)).toEqual(["tundra", "nordtoppen", "muren"]);
    expect(ids(23)).toEqual(["tundra", "nordtoppen", "muren"]);
    expect(ids(24)).toHaveLength(4);
  });

  it("builds the same course every time, sorted by distance", () => {
    for (const e of ETAPPER) {
      const a = lagBane(e);
      expect(a).toEqual(lagBane(e));
      expect(a.every((t, i) => i === 0 || t.z >= a[i - 1].z)).toBe(true);
      expect(a.filter((t) => t.type === "varde").length).toBeGreaterThan(20);
    }
    expect(lagBane(ETAPPER[2]).filter((t) => t.type === "mur")).toHaveLength(3);
    expect(lagBane(ETAPPER[3]).some((t) => t.type === "grotte")).toBe(true);
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
    const tre = sim.s.ting.find((t) => t.type === "tre")!;
    sim.s.px = tre.x;
    sim.s.dist = tre.z - 1;
    sim.s.alt = 60;
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

  it("reduced motion flies slower and still finishes", () => {
    const fast = fly("tundra", true);
    const slow = fly("tundra", true, true);
    expect(slow.s.ferdig).toBe(true);
    expect(slow.s.tid).toBeGreaterThan(fast.s.tid * 1.2);
  });

  it("bells: 40 % one, 70 % two, 90 % and no crash three", () => {
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
    const tre = sim.s.ting.find((t) => t.type === "tre")!;
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

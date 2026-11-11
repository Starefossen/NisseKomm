import { describe, expect, it } from "@jest/globals";
import { ALT_MAX, type Styring } from "./slede";
import {
  BERGEN_SLUTT,
  createFri,
  FUGLER,
  fuglPos,
  GRENSE,
  høyde,
  kmTekst,
  lagHus,
  MUR,
  nærmesteSted,
  peiling,
  STEDER,
  stedsnavn,
  utenfor,
  vinkelTil,
  type FriOpts,
} from "./vidda";

const still: Styring = { steer: 0, climb: 0, sprang: false };
const dag8: FriOpts = { dag: 8, bergen: false, landås: false };
const julaften: FriOpts = { dag: 24, bergen: true, landås: true };
const sted = (id: string) => STEDER.find((s) => s.id === id)!;

const fly = (sim: ReturnType<typeof createFri>, sek: number, inn = still) => {
  const ev: string[] = [];
  for (let i = 0; i < sek * 60; i++) ev.push(...sim.step(1 / 60, inn));
  return ev;
};

describe("fri flyging på vidda", () => {
  it("flies by heading: north by default, a held stick turns it round", () => {
    const sim = createFri(dag8);
    const z0 = sim.s.z;
    fly(sim, 2);
    expect(sim.s.z).toBeLessThan(z0 - 1000);
    expect(Math.abs(sim.s.x)).toBeLessThan(1);
    fly(sim, 3, { ...still, steer: 1 });
    expect(sim.s.kurs).toBeGreaterThan(Math.PI / 2);
    expect(sim.s.x).toBeGreaterThan(500);
    expect(sim.s.bank).toBeGreaterThan(0.2);
    expect(peiling(0, 0, 100, 0)).toBeCloseTo(Math.PI / 2);
    expect(vinkelTil(0.1, -0.1)).toBeCloseTo(-0.2);
    expect(vinkelTil(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(kmTekst(12345)).toBe("1,2 KM");
  });

  it("finds Snøfall first, then each open place once, with the nearest one named", () => {
    const sim = createFri(dag8);
    const ev = fly(sim, 3);
    expect(ev.filter((e) => e === "oppdaget")).toHaveLength(1);
    expect(sim.s.sisteSted).toBe("SNØFALL");
    expect(nærmesteSted(sim.s, dag8)).toMatch(
      /^(ANTENNA VED TJERNET|GÅRDENE) \d,\d KM$/,
    );
    const a = sted("antenne");
    sim.s.x = a.x;
    sim.s.z = a.z + a.r + 500;
    expect(fly(sim, 1)).toContain("oppdaget");
    expect(sim.s.sisteSted).toBe("ANTENNA VED TJERNET");
    expect(fly(sim, 1)).not.toContain("oppdaget");
  });

  it("keeps the sled out of a locked place and says when it opens", () => {
    const n = sted("nordtoppen");
    const sim = createFri(dag8);
    sim.s.x = n.x;
    sim.s.z = n.z + n.r + 300;
    sim.s.alt = ALT_MAX;
    const ev = fly(sim, 4);
    expect(ev).toContain("låst");
    expect(ev).not.toContain("oppdaget");
    expect(sim.s.sisteSted).toBe("ÅPNER DAG 20");
    expect(Math.hypot(sim.s.x - n.x, sim.s.z - n.z)).toBeGreaterThan(n.r);
    expect(stedsnavn(sted("grotten"), dag8)).toBe("ÅPNER JULAFTEN");
    expect(stedsnavn(sted("grotten"), { ...dag8, dag: 24 })).toBe(
      "KRYSTALLGROTTEN",
    );
    expect(stedsnavn(sted("grotten"), { ...dag8, dag: 24 }, true)).toBe(
      "GROTTEN",
    );
  });

  it("turns the sled back at the curtain and never lets it far outside", () => {
    const sim = createFri(dag8);
    sim.s.kurs = Math.PI / 2;
    sim.s.x = GRENSE - 2000;
    let maks = 0;
    const ev = fly(sim, 30, { ...still, gass: 1 });
    for (let i = 0; i < 60 * 30; i++) {
      sim.step(1 / 60, { ...still, gass: 1 });
      maks = Math.max(maks, utenfor(sim.s.x, sim.s.z, false).ute);
    }
    expect(ev).toContain("snu");
    expect(maks).toBeLessThan(4500);
    expect(Math.hypot(sim.s.x, sim.s.z)).toBeLessThan(GRENSE + 500);
    expect(utenfor(0, 0, false).ute).toBe(0);
    expect(utenfor(0, GRENSE + 5000, false).ute).toBe(5000);
  });

  it("opens the corridor to Bergen only with day 24 solved, and names Landås only with day 22", () => {
    expect(utenfor(0, GRENSE + 5000, true).ute).toBe(0);
    expect(utenfor(0, BERGEN_SLUTT + 100, true).ute).toBe(100);
    expect(stedsnavn(sted("bergen"), dag8)).toBe("ÅPNER JULAFTEN");
    expect(stedsnavn(sted("bergen"), { ...julaften, landås: false })).toBe(
      "BERGEN",
    );
    expect(stedsnavn(sted("bergen"), julaften)).toBe("LANDÅS");
    expect(lagHus(false).every((h) => h.z < GRENSE)).toBe(true);
    expect(lagHus(true).filter((h) => h.z > GRENSE).length).toBeGreaterThan(20);
    const sim = createFri(julaften);
    sim.s.kurs = Math.PI;
    sim.s.z = GRENSE - 1500;
    const ev = fly(sim, 6);
    expect(ev).toContain("bergen");
    expect(sim.s.z).toBeGreaterThan(GRENSE + 1000);
    const låst = createFri({ ...julaften, bergen: false });
    låst.s.kurs = Math.PI;
    låst.s.z = GRENSE - 1500;
    const ev2 = fly(låst, 10);
    expect(ev2).not.toContain("bergen");
    expect(ev2).toContain("låst");
  });

  it("treats mountains as obstacles: a crash at Nordtoppen's flank, a ride over a low hill", () => {
    expect(høyde(sted("nordtoppen").x, sted("nordtoppen").z)).toBeGreaterThan(
      ALT_MAX,
    );
    expect(høyde(MUR.x, MUR.z)).toBeLessThan(40);
    expect(høyde(MUR.x + MUR.port * 2.5, MUR.z)).toBeGreaterThan(200);
    const n = sted("nordtoppen");
    const sim = createFri({ ...dag8, dag: 20 });
    sim.s.x = n.x;
    sim.s.z = n.z + 2400;
    sim.s.alt = 120;
    const ev = fly(sim, 6);
    expect(ev).toContain("krasj");
    expect(Math.hypot(sim.s.x - n.x, sim.s.z - n.z)).toBeGreaterThan(700);
    expect(sim.s.alt).toBeGreaterThanOrEqual(høyde(sim.s.x, sim.s.z) + 30);
    const lav = createFri(dag8);
    lav.s.x = -4000;
    lav.s.z = -6000 + 3000;
    lav.s.alt = 120;
    expect(fly(lav, 5)).not.toContain("krasj");
    expect(lav.s.z).toBeLessThan(-6000);
  });

  it("catches a bird in the air and drops a package down a chimney", () => {
    const sim = createFri(dag8);
    const f = fuglPos(FUGLER[0], 1 / 60);
    sim.s.x = f.x;
    sim.s.z = f.z + 10;
    sim.s.alt = f.alt;
    expect(sim.step(1 / 60, still)).toContain("fugl");
    expect(sim.s.fugler).toBe(1);
    // Some drop point north-bound over the first house lands the package down its chimney.
    const hus = lagHus(false)[0];
    const treff: string[] = [];
    for (let d = 0; d < 1500 && !treff.includes("levering"); d += 20) {
      const p = createFri(dag8);
      p.s.x = hus.x;
      p.s.z = hus.z + d;
      p.s.alt = hus.h + 40;
      p.s.kurs = 0;
      const ev = p.step(1 / 60, { ...still, slipp: true });
      expect(ev).toContain("slipp");
      treff.push(...fly(p, 1.5));
      if (treff.includes("levering")) expect(p.s.pakker).toBe(1);
    }
    expect(treff).toContain("levering");
    expect(treff).toContain("pakkebom");
  });

  it("a dive into the ground crashes, stops the sled, then sets it down behind and higher", () => {
    const sim = createFri(dag8);
    const ev = fly(sim, 3, { steer: 0, climb: -1, sprang: false });
    expect(ev).toContain("krasj");
    const { x, z } = sim.s;
    sim.s.stoppTil = sim.s.tid + 1;
    fly(sim, 0.5);
    expect([sim.s.x, sim.s.z]).toEqual([x, z]);
  });
});

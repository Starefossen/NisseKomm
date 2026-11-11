import { describe, expect, it } from "@jest/globals";
import { ALT_MAX, type Styring } from "./slede";
import {
  BERGEN_KURS,
  BERGEN_SLUTT,
  bygg,
  fraKorridor,
  iKorridor,
  murPunkt,
  TUN,
  ALT_MIN,
  husTopp,
  createFri,
  FJELL,
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
  vindStyrke,
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
    sim.s.kurs = 0;
    const z0 = sim.s.z;
    fly(sim, 2);
    expect(sim.s.z).toBeLessThan(z0 - 1000);
    // The wind drifts it a little sideways, never off course.
    expect(Math.abs(sim.s.x)).toBeLessThan(300);
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
    expect(utenfor(...fraKorridor(GRENSE + 5000, 0), true).ute).toBe(0);
    expect(
      utenfor(...fraKorridor(BERGEN_SLUTT + 100, 0), true).ute,
    ).toBeCloseTo(100);
    // The corridor leaves north-east, behind the cave; south is curtain.
    expect(BERGEN_KURS).toBeGreaterThan(0.1);
    expect(BERGEN_KURS).toBeLessThan(Math.PI / 2);
    expect(utenfor(0, GRENSE + 5000, true).ute).toBe(5000);
    const g = sted("grotten");
    expect(Math.abs(iKorridor(g.x, g.z).v)).toBeLessThan(1);
    expect(stedsnavn(sted("bergen"), dag8)).toBe("ÅPNER JULAFTEN");
    expect(stedsnavn(sted("bergen"), { ...julaften, landås: false })).toBe(
      "BERGEN",
    );
    expect(stedsnavn(sted("bergen"), julaften)).toBe("LANDÅS");
    const u = (h: { x: number; z: number }) => iKorridor(h.x, h.z).u;
    expect(lagHus(false).every((h) => u(h) < GRENSE)).toBe(true);
    expect(lagHus(true).filter((h) => u(h) > GRENSE).length).toBeGreaterThan(
      20,
    );
    const sim = createFri(julaften);
    sim.s.kurs = BERGEN_KURS;
    [sim.s.x, sim.s.z] = fraKorridor(GRENSE - 1500, 0);
    sim.s.alt = 200;
    const ev = fly(sim, 6);
    expect(ev).toContain("bergen");
    expect(u(sim.s)).toBeGreaterThan(GRENSE + 1000);
    const låst = createFri({ ...julaften, bergen: false });
    låst.s.kurs = BERGEN_KURS;
    [låst.s.x, låst.s.z] = fraKorridor(GRENSE - 1500, 0);
    låst.s.alt = 200;
    const ev2 = fly(låst, 10);
    expect(ev2).not.toContain("bergen");
    expect(ev2).toContain("låst");
  });

  it("treats mountains as obstacles: a crash at Nordtoppen's flank, a ride over a low hill", () => {
    expect(høyde(sted("nordtoppen").x, sted("nordtoppen").z)).toBeGreaterThan(
      ALT_MAX,
    );
    expect(høyde(MUR.x, MUR.z)).toBeLessThan(40);
    expect(høyde(...murPunkt(MUR.port * 2.5))).toBeGreaterThan(200);
    expect(høyde(...murPunkt(-MUR.port * 2.5))).toBeGreaterThan(200);
    // IQ's wall lies between Snøfall and the cave, the cave at Nordtoppen's north-east foot.
    const g = sted("grotten");
    const n2 = sted("nordtoppen");
    expect(Math.hypot(MUR.x, MUR.z)).toBeLessThan(Math.hypot(g.x, g.z));
    expect(g.x).toBeGreaterThan(n2.x);
    expect(g.z).toBeLessThan(n2.z);
    expect(Math.hypot(g.x - n2.x, g.z - n2.z)).toBeLessThan(4000);
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

  it("flies in under Snøfall's gate arch, but the wall, the gable and the turrets stop it", () => {
    const inn = createFri({ ...dag8, reduceMotion: true });
    [inn.s.alt, inn.s.kurs] = [90, 0];
    const ev = fly(inn, 2.5);
    expect(ev).not.toContain("krasj");
    expect(inn.s.z).toBeLessThan(TUN.r - 200);
    expect(bygg(0, TUN.r, 90)).toBe(0);
    expect(bygg(0, TUN.r, 150)).toBeGreaterThan(150);
    expect(bygg(TUN.r, 0, 90)).toBe(TUN.h);
    expect(bygg(0, 0, 100)).toBeGreaterThan(200);
    const gavl = createFri({ ...dag8, reduceMotion: true });
    [gavl.s.alt, gavl.s.kurs] = [150, 0];
    expect(fly(gavl, 2)).toContain("krasj");
    const mur = createFri(dag8);
    [mur.s.x, mur.s.z, mur.s.kurs, mur.s.alt] = [
      TUN.r + 600,
      0,
      -Math.PI / 2,
      70,
    ];
    expect(fly(mur, 1.5)).toContain("krasj");
    expect(mur.s.x).toBeGreaterThan(TUN.r);
    const over = createFri(dag8);
    [over.s.x, over.s.z, over.s.kurs, over.s.alt] = [
      TUN.r + 600,
      0,
      -Math.PI / 2,
      150,
    ];
    expect(fly(over, 1.5)).not.toContain("krasj");
    expect(over.s.x).toBeLessThan(TUN.r);
  });

  it("starts above the roofs, over the gate, past the clock tower without a crash", () => {
    const sim = createFri({ ...dag8, reduceMotion: true });
    expect(sim.s.alt).toBeGreaterThan(TUN.gavl + 35);
    const ev = fly(sim, 6);
    expect(ev).not.toContain("krasj");
    expect(ev).not.toContain("skrape");
    expect(sim.s.z).toBeLessThan(-200);
  });

  it("ring houses block the sled like the other buildings", () => {
    const h = lagHus(false)[0];
    const mot = (alt: number) => {
      const sim = createFri(dag8);
      [sim.s.x, sim.s.z, sim.s.kurs, sim.s.alt] = [h.x, h.z + 500, 0, alt];
      return fly(sim, 1);
    };
    expect(mot(ALT_MIN + 5)).toContain("krasj");
    expect(husTopp([h], h.x, h.z)).toBe(h.h);
    expect(husTopp([h], h.x + 200, h.z)).toBe(0);
    expect(mot(h.h + 50)).not.toContain("krasj");
  });

  it("finds Muren and the cave on the days they open, and keeps the sled out before", () => {
    for (const [id, dag] of [
      ["muren", 21],
      ["grotten", 24],
    ] as const) {
      const st = sted(id);
      const b = Math.atan2(st.x, -st.z);
      const start = (o: FriOpts) => {
        const sim = createFri(o);
        sim.s.x = st.x - Math.sin(b) * (st.r + 600);
        sim.s.z = st.z + Math.cos(b) * (st.r + 600);
        sim.s.kurs = b;
        sim.s.alt = 300;
        return sim;
      };
      const før = start({ ...dag8, dag: dag - 1 });
      expect(fly(før, 3)).toContain("låst");
      expect(Math.hypot(før.s.x - st.x, før.s.z - st.z)).toBeGreaterThan(st.r);
      const på = start({ ...dag8, dag });
      expect(fly(på, 3)).toContain("oppdaget");
      expect(på.s.oppdaget.has(id)).toBe(true);
    }
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
    const bom = createFri(dag8);
    [bom.s.z, bom.s.alt] = [9000, 200];
    bom.step(1 / 60, { ...still, slipp: true });
    expect(fly(bom, 2)).toContain("pakkebom");
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

  it("wind is gentle on the plain, gusty by the peaks and high up", () => {
    const n = FJELL[0];
    expect(vindStyrke(0, 9000, 100)).toBeLessThan(0.4);
    expect(vindStyrke(n.x + n.r, n.z, 100)).toBeGreaterThan(0.5);
    expect(vindStyrke(0, 9000, ALT_MAX)).toBeGreaterThan(
      vindStyrke(0, 9000, 100) + 0.2,
    );
  });
});

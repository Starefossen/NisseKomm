import { describe, expect, it } from "@jest/globals";
import { ETAPPER, lagBane } from "../snofall-tv/slede";
import { apply, STRIDE, transform } from "./gl";
import {
  bakke,
  lagFlis,
  lagVerden,
  meshes,
  murMesh,
  SKALA,
  SPOR,
  tilVerden,
} from "./verden";

describe("sledeflukt verden", () => {
  it("maps sim units to the valley: forward is -z, altitude scales, the lane bends", () => {
    const p = tilVerden(1, 120, 5000);
    expect(p[2]).toBeCloseTo(-500);
    expect(p[1]).toBeCloseTo(12);
    expect(Math.abs(p[0] - SPOR)).toBeLessThan(0.3 * SPOR + 1e-6);
  });

  it("keeps the lane floor flat enough to fly at the minimum altitude", () => {
    for (let z = 0; z < 70000; z += 700)
      for (const x of [-1.3, -0.6, 0, 0.6, 1.3]) {
        const [wx] = tilVerden(x, 0, z);
        expect(Math.abs(bakke(wx, z))).toBeLessThan(40 * SKALA);
      }
  });

  it("builds tiles and meshes as whole flat-shaded triangles", () => {
    const flis = lagFlis(3);
    expect(flis.length % (STRIDE * 3)).toBe(0);
    expect(flis.length).toBeGreaterThan(1000);
    const m = meshes();
    for (const mesh of [
      m.tre,
      m.ring,
      m.stjerne,
      m.topp,
      m.band,
      m.slede,
      m.bein,
      m.tømmer,
      ...m.rein,
      ...m.hus.map((h) => h.mesh),
    ]) {
      expect(mesh.length % (STRIDE * 3)).toBe(0);
      expect(mesh.length).toBeGreaterThan(0);
    }
    expect(murMesh(0.5).length % (STRIDE * 3)).toBe(0);
  });

  it("puts houses off the lane with chimneys above the roof, and a wall mesh per gate", () => {
    const e = ETAPPER[ETAPPER.length - 1];
    const v = lagVerden(e);
    expect(v.hus.length).toBeGreaterThan(8);
    for (const h of v.hus) {
      const [cx] = tilVerden(0, 0, h.zSim);
      expect(Math.abs(h.pos[0] - cx)).toBeGreaterThan(1.3 * SPOR + 5);
      expect(h.pipe[1]).toBeGreaterThan(h.pos[1] + 5);
    }
    const trær = lagBane(e).filter((t) => t.type === "tre").length;
    expect(v.trær.length / 4).toBeGreaterThan(trær);
    const muren = lagVerden(ETAPPER.find((x) => x.id === "muren")!);
    expect(muren.spesial.size).toBe(3);
  });

  it("transform composes translation and rotation", () => {
    const m = transform([1, 2, 3], [0, Math.PI / 2, 0]);
    const p = apply(m, [1, 0, 0]);
    expect(p[0]).toBeCloseTo(1);
    expect(p[1]).toBeCloseTo(2);
    expect(p[2]).toBeCloseTo(2);
  });
});

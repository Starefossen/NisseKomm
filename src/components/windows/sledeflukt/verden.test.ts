import { describe, expect, it } from "@jest/globals";
import { ETAPPER, lagBane } from "../snofall-tv/slede";
import { apply, STRIDE, transform } from "./gl";
import {
  bakke,
  fjernMesh,
  gardinMesh,
  husPlassFri,
  kursYaw,
  lagFlis,
  lagRute,
  lagVerden,
  meshes,
  murGlødMesh,
  murMesh,
  SKALA,
  SPOR,
  tilVerden,
  tilVidda,
} from "./verden";
import { GRENSE, høyde, lagHus } from "../snofall-tv/vidda";

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
      m.rein,
      m.røyk,
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

  it("rings face along the bend: the course yaw is small and follows midt()", () => {
    expect(Math.abs(kursYaw(0))).toBeLessThan(0.3);
    expect(kursYaw(2600 * Math.PI)).toBeCloseTo(-kursYaw(0), 2);
  });

  it("builds the vidda: square tiles on høyde(), trees off the places, a horizon mesh and the curtain", () => {
    const r = lagRute(3, -2);
    expect(r.mesh.length % (STRIDE * 3)).toBe(0);
    expect(r.mesh.length).toBe(10 * 10 * 2 * 3 * STRIDE);
    expect(r.mesh[1]).toBeCloseTo(høyde(600 / SKALA, -400 / SKALA) * SKALA);
    expect(r.trær.length % 4).toBe(0);
    let trær = 0;
    for (let ix = -12; ix <= 12; ix++)
      for (let iz = -12; iz <= 12; iz++) {
        const t = lagRute(ix, iz).trær;
        trær += t.length / 4;
        for (let i = 0; i < t.length; i += 4)
          expect(Math.hypot(t[i], t[i + 2])).toBeGreaterThan(
            1800 * 0.7 * SKALA,
          );
      }
    expect(trær).toBeGreaterThan(200);
    expect(fjernMesh().length % (STRIDE * 3)).toBe(0);
    const åpen = gardinMesh(true);
    const lukket = gardinMesh(false);
    expect(lukket.length).toBeGreaterThan(åpen.length);
    expect(tilVidda(1000, 120, -2000)).toEqual([100, 12, -200]);
    // A house's chimney stands at its (x, z) whichever way it faces.
    for (const h of lagHus(true).slice(0, 12)) {
      const { pipe } = meshes().hus[h.variant];
      const p = apply(husPlassFri(h), pipe);
      expect(p[0]).toBeCloseTo(h.x * SKALA, 3);
      expect(p[2]).toBeCloseTo(h.z * SKALA, 3);
      expect(h.z < GRENSE || h.z > GRENSE).toBe(true);
    }
  });

  it("transform composes translation and rotation", () => {
    const m = transform([1, 2, 3], [0, Math.PI / 2, 0]);
    const p = apply(m, [1, 0, 0]);
    expect(p[0]).toBeCloseTo(1);
    expect(p[1]).toBeCloseTo(2);
    expect(p[2]).toBeCloseTo(2);
  });

  it("Muren's glow runs along the whole arc on the ridge crest, every vertex lit", () => {
    const g = murGlødMesh();
    expect(g.length / STRIDE).toBeGreaterThan(100);
    for (let i = 0; i < g.length; i += STRIDE) expect(g[i + 9]).toBe(1);
    let topp = 0;
    for (let i = 1; i < g.length; i += STRIDE) topp = Math.max(topp, g[i]);
    expect(topp).toBeGreaterThan(30);
  });
});

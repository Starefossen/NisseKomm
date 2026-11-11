import { describe, expect, it } from "@jest/globals";
import { apply, bak, multiply, STRIDE, transform, type Vec3 } from "./gl";

// The old five-array form, kept as the reference for the closed form.
function referanse(pos: Vec3, [rx, ry, rz]: Vec3, s: number) {
  const [cx, sx, cy, sy, cz, sz] = [rx, rx, ry, ry, rz, rz].map((v, i) =>
    i % 2 ? Math.sin(v) : Math.cos(v),
  );
  const mx = new Float32Array([
    1,
    0,
    0,
    0,
    0,
    cx,
    sx,
    0,
    0,
    -sx,
    cx,
    0,
    0,
    0,
    0,
    1,
  ]);
  const my = new Float32Array([
    cy,
    0,
    -sy,
    0,
    0,
    1,
    0,
    0,
    sy,
    0,
    cy,
    0,
    0,
    0,
    0,
    1,
  ]);
  const mz = new Float32Array([
    cz,
    sz,
    0,
    0,
    -sz,
    cz,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ]);
  const m = multiply(multiply(my, mx), mz);
  for (let i = 0; i < 12; i++) if (i % 4 < 3) m[i] *= s;
  m.set(pos, 12);
  return m;
}

describe("gl", () => {
  it("transform matches the rotate-then-multiply reference", () => {
    for (const rot of [
      [0.3, -1.2, 0.7],
      [Math.PI, 0.1, -2],
      [0, 0, 0],
    ] as Vec3[]) {
      const a = transform([1, 2, 3], rot, 1.7);
      const b = referanse([1, 2, 3], rot, 1.7);
      for (let i = 0; i < 16; i++) expect(a[i]).toBeCloseTo(b[i], 5);
    }
  });

  it("bak places each vertex where the model matrix would", () => {
    const mesh = new Float32Array(STRIDE * 2);
    mesh.set([1, 2, 3, 0, 1, 0, 0.5, 0.5, 0.5, 0]);
    mesh.set([-1, 0, 4, 1, 0, 0, 1, 0, 0, 1], STRIDE);
    const m = transform([10, 0, -5], [0, 0.8, 0], 2);
    const ut = bak([[mesh, m]]);
    const p = apply(m, [-1, 0, 4]);
    for (let i = 0; i < 3; i++) expect(ut[STRIDE + i]).toBeCloseTo(p[i], 4);
    expect(Array.from(ut.subarray(STRIDE + 6))).toEqual([1, 0, 0, 1]);
  });
});

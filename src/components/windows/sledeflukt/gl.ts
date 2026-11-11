/**
 * SLEDEFLUKT: matrix math, mesh builder and the palette. No DOM, no WebGL.
 * Vertex layout is 10 floats: position, normal, colour, glow (1 = unlit).
 * Every triangle carries its own face normal, so shading is flat by construction.
 */

export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;

export const STRIDE = 10;

export const hex = (c: number): Vec3 => [
  ((c >> 16) & 255) / 255,
  ((c >> 8) & 255) / 255,
  (c & 255) / 255,
];

export const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const identity = (): Mat4 =>
  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** Column-major a × b. */
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      r[4 * i + j] =
        a[j] * b[4 * i] +
        a[4 + j] * b[4 * i + 1] +
        a[8 + j] * b[4 * i + 2] +
        a[12 + j] * b[4 * i + 3];
  return r;
}

/** Translate · rotateY · rotateX · rotateZ · scale (rotation in radians). */
export function transform(
  pos: Vec3 = [0, 0, 0],
  rot: Vec3 = [0, 0, 0],
  scale: Vec3 | number = 1,
): Mat4 {
  const [rx, ry, rz] = rot;
  const cx = Math.cos(rx),
    sx = Math.sin(rx),
    cy = Math.cos(ry),
    sy = Math.sin(ry),
    cz = Math.cos(rz),
    sz = Math.sin(rz);
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
  const s = typeof scale === "number" ? [scale, scale, scale] : scale;
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[4 * c + r] *= s[c];
  m[12] = pos[0];
  m[13] = pos[1];
  m[14] = pos[2];
  return m;
}

export function apply(m: Mat4, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
  ];
}

export function lookAt(eye: Vec3, target: Vec3): Mat4 {
  const f = normalize([
    eye[0] - target[0],
    eye[1] - target[1],
    eye[2] - target[2],
  ]);
  const s = normalize(cross([0, 1, 0], f));
  const u = cross(f, s);
  const dot = (a: Vec3) => a[0] * eye[0] + a[1] * eye[1] + a[2] * eye[2];
  return new Float32Array([
    s[0],
    u[0],
    f[0],
    0,
    s[1],
    u[1],
    f[1],
    0,
    s[2],
    u[2],
    f[2],
    0,
    -dot(s),
    -dot(u),
    -dot(f),
    1,
  ]);
}

export function perspective(
  fovY: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}

/** Builds flat-shaded triangle soup. Ported from the prototype, segments kept low. */
export class Mesh {
  private v: number[] = [];

  triangle(a: Vec3, b: Vec3, c: Vec3, col: Vec3, glow = 0) {
    const n = normalize(
      cross(
        [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
        [c[0] - a[0], c[1] - a[1], c[2] - a[2]],
      ),
    );
    for (const p of [a, b, c])
      this.v.push(
        p[0],
        p[1],
        p[2],
        n[0],
        n[1],
        n[2],
        col[0],
        col[1],
        col[2],
        glow,
      );
    return this;
  }

  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, col: Vec3, glow = 0) {
    return this.triangle(a, b, c, col, glow).triangle(a, c, d, col, glow);
  }

  box(centre: Vec3, size: Vec3, col: Vec3, glow = 0) {
    const [x, y, z] = centre;
    const [w, h, d] = size.map((s) => s / 2);
    const c: Vec3[] = [
      [x - w, y - h, z - d],
      [x + w, y - h, z - d],
      [x + w, y + h, z - d],
      [x - w, y + h, z - d],
      [x - w, y - h, z + d],
      [x + w, y - h, z + d],
      [x + w, y + h, z + d],
      [x - w, y + h, z + d],
    ];
    for (const [a, b, e, f] of [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 4, 7, 3],
      [1, 2, 6, 5],
      [3, 7, 6, 2],
      [0, 1, 5, 4],
    ])
      this.quad(c[a], c[b], c[e], c[f], col, glow);
    return this;
  }

  /** Cone (or frustum with topRadius > 0) standing on its base at `base`. */
  cone(
    base: Vec3,
    radius: number,
    height: number,
    col: Vec3,
    segs = 6,
    topRadius = 0,
    glow = 0,
  ) {
    const [x, y, z] = base;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const b0: Vec3 = [
        x + Math.cos(a0) * radius,
        y,
        z + Math.sin(a0) * radius,
      ];
      const b1: Vec3 = [
        x + Math.cos(a1) * radius,
        y,
        z + Math.sin(a1) * radius,
      ];
      const t1: Vec3 = [
        x + Math.cos(a1) * topRadius,
        y + height,
        z + Math.sin(a1) * topRadius,
      ];
      const t0: Vec3 = [
        x + Math.cos(a0) * topRadius,
        y + height,
        z + Math.sin(a0) * topRadius,
      ];
      if (topRadius > 0) this.quad(b1, b0, t0, t1, col, glow);
      else this.triangle(b1, b0, [x, y + height, z], col, glow);
      this.triangle(b0, b1, [x, y, z], col, glow);
      if (topRadius > 0) this.triangle(t1, t0, [x, y + height, z], col, glow);
    }
    return this;
  }

  rod(
    a: Vec3,
    b: Vec3,
    radius: number,
    col: Vec3,
    segs = 4,
    radiusB = radius,
    glow = 0,
  ) {
    const dir = normalize([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    const side = normalize(
      cross(dir, Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]),
    );
    const up = cross(dir, side);
    const at = (p: Vec3, r: number, ang: number): Vec3 => [
      p[0] + r * (side[0] * Math.cos(ang) + up[0] * Math.sin(ang)),
      p[1] + r * (side[1] * Math.cos(ang) + up[1] * Math.sin(ang)),
      p[2] + r * (side[2] * Math.cos(ang) + up[2] * Math.sin(ang)),
    ];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      this.quad(
        at(a, radius, a0),
        at(a, radius, a1),
        at(b, radiusB, a1),
        at(b, radiusB, a0),
        col,
        glow,
      );
    }
    return this;
  }

  ellipsoid(
    centre: Vec3,
    radii: Vec3,
    col: Vec3,
    around = 8,
    down = 4,
    glow = 0,
  ) {
    const at = (u: number, v: number): Vec3 => [
      centre[0] + Math.sin(v) * Math.cos(u) * radii[0],
      centre[1] + Math.cos(v) * radii[1],
      centre[2] + Math.sin(v) * Math.sin(u) * radii[2],
    ];
    for (let j = 0; j < down; j++)
      for (let i = 0; i < around; i++) {
        const u0 = (i / around) * Math.PI * 2;
        const u1 = ((i + 1) / around) * Math.PI * 2;
        const v0 = (j / down) * Math.PI;
        const v1 = ((j + 1) / down) * Math.PI;
        this.quad(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1), col, glow);
      }
    return this;
  }

  /** Append another mesh transformed by m (rotation assumed near-uniform, normals renormalised). */
  append(mesh: Float32Array, m: Mat4) {
    for (let i = 0; i < mesh.length; i += STRIDE) {
      const p = apply(m, [mesh[i], mesh[i + 1], mesh[i + 2]]);
      const n = normalize([
        m[0] * mesh[i + 3] + m[4] * mesh[i + 4] + m[8] * mesh[i + 5],
        m[1] * mesh[i + 3] + m[5] * mesh[i + 4] + m[9] * mesh[i + 5],
        m[2] * mesh[i + 3] + m[6] * mesh[i + 4] + m[10] * mesh[i + 5],
      ]);
      this.v.push(
        p[0],
        p[1],
        p[2],
        n[0],
        n[1],
        n[2],
        mesh[i + 6],
        mesh[i + 7],
        mesh[i + 8],
        mesh[i + 9],
      );
    }
    return this;
  }

  build() {
    return new Float32Array(this.v);
  }
}

/**
 * 32 colours: night sky, snow, spruce, wood, fur, red, gold and the HUD green.
 * The post pass snaps every pixel to the nearest of these after ordered dither.
 */
export const PALETT: readonly Vec3[] = [
  0x050816, 0x0b1430, 0x141c3a, 0x1a2448, 0x263046, 0x3a4458, 0xffffff,
  0xeef3fb, 0xd9e4f5, 0xc0d2ec, 0x9fb0cc, 0x7f93b0, 0x5a6b8a, 0x0f2a1e,
  0x163d2b, 0x1f5a3c, 0x2e7a4f, 0x3a2a1e, 0x5a3f2a, 0x7a5a3c, 0xa07a50,
  0x6b4e35, 0x8f6e4c, 0xc9b08a, 0x8a1c1c, 0xc62828, 0xf0624a, 0xffd700,
  0xffb347, 0xff8a3c, 0x00ff8a, 0x4a5060,
].map(hex);

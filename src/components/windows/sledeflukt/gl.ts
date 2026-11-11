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

/**
 * Translate · rotateY · rotateX · rotateZ · scale (rotation in radians), in
 * closed form: one array per call instead of five (dozens of objects a frame).
 */
export function transform(
  pos: Vec3 = [0, 0, 0],
  rot: Vec3 = [0, 0, 0],
  scale: Vec3 | number = 1,
  m: Mat4 = new Float32Array(16),
): Mat4 {
  const [rx, ry, rz] = rot;
  const cx = Math.cos(rx),
    sx = Math.sin(rx),
    cy = Math.cos(ry),
    sy = Math.sin(ry),
    cz = Math.cos(rz),
    sz = Math.sin(rz);
  const [a, b, c] = typeof scale === "number" ? [scale, scale, scale] : scale;
  m[0] = (cy * cz + sy * sx * sz) * a;
  m[1] = cx * sz * a;
  m[2] = (-sy * cz + cy * sx * sz) * a;
  m[3] = 0;
  m[4] = (-cy * sz + sy * sx * cz) * b;
  m[5] = cx * cz * b;
  m[6] = (sy * sz + cy * sx * cz) * b;
  m[7] = 0;
  m[8] = sy * cx * c;
  m[9] = -sx * c;
  m[10] = cy * cx * c;
  m[11] = 0;
  m[12] = pos[0];
  m[13] = pos[1];
  m[14] = pos[2];
  m[15] = 1;
  return m;
}

/** Many meshes placed once, as one mesh: one draw call for everything static. */
export function bak(deler: readonly (readonly [Float32Array, Mat4])[]) {
  let n = 0;
  for (const [mesh] of deler) n += mesh.length;
  const ut = new Float32Array(n);
  let o = 0;
  for (const [mesh, m] of deler) {
    for (let i = 0; i < mesh.length; i += STRIDE, o += STRIDE) {
      const [x, y, z, nx, ny, nz] = mesh.subarray(i, i + 6);
      ut[o] = m[0] * x + m[4] * y + m[8] * z + m[12];
      ut[o + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
      ut[o + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
      const v = normalize([
        m[0] * nx + m[4] * ny + m[8] * nz,
        m[1] * nx + m[5] * ny + m[9] * nz,
        m[2] * nx + m[6] * ny + m[10] * nz,
      ]);
      ut.set(v, o + 3);
      ut.set(mesh.subarray(i + 6, i + STRIDE), o + 6);
    }
  }
  return ut;
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
 * 64 colours, a 16-bit-era palette: night sky, snow and ice, spruce, wood, fur,
 * red, gold, rock and the HUD green, each with in-between shades so slopes and
 * fog grade softly. The post pass snaps every pixel to the nearest after a light dither.
 */
export const PALETT: readonly Vec3[] = [
  // sky
  0x050816, 0x0b1430, 0x0e1a30, 0x141c3a, 0x1a2448, 0x1f2b4f, 0x263046,
  0x2c3a5c, 0x3a4458, 0x4a5670,
  // snow, ice, haze
  0xffffff, 0xeef3fb, 0xe4ecf8, 0xd9e4f5, 0xcddcf0, 0xc0d2ec, 0xb0c3e0,
  0x9fb0cc, 0x8ea4c8, 0x93a6c6, 0x7f93b0, 0x6d7fa0, 0x5a6b8a, 0xaab4c6,
  0xc3ccd8,
  // spruce
  0x0f2a1e, 0x12331f, 0x163d2b, 0x1a4a33, 0x1f5a3c, 0x266a46, 0x2e7a4f,
  0x3b8f5e,
  // wood
  0x3a2a1e, 0x4a3424, 0x5a3f2a, 0x6a4c33, 0x7a5a3c, 0x8d6a46, 0xa07a50,
  // fur
  0x6b4e35, 0x7d5e40, 0x8f6e4c, 0xab8c66, 0xc9b08a,
  // red
  0x6a1414, 0x8a1c1c, 0xa82222, 0xc62828, 0xe04a3a, 0xf0624a,
  // gold and lantern light
  0xc9962a, 0xe6b800, 0xffd700, 0xffe680, 0xffc96b, 0xffb347, 0xff8a3c,
  // rock
  0x3c4150, 0x4a5060, 0x585e70, 0x6e7585,
  // HUD green
  0x00c86a, 0x00ff8a,
].map(hex);

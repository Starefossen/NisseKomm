/**
 * SLEDEFLUKT: the 3D world around the pure sim in snofall-tv/slede.ts.
 * The sim keeps its units (x in track units, altitude and z in sim units); this
 * module maps them to render units (SKALA) and builds every mesh: valley tiles,
 * trees, Snøfall houses with chimneys, the rings and things on the course and the rig.
 * Nothing here touches the DOM or WebGL, so it is testable.
 */

import { hex, type Mat4, Mesh, transform, type Vec3 } from "./gl";
import {
  HUS_PIPE,
  lagBane,
  RING_ALT,
  RING_X,
  type SledeEtappe,
  type Ting,
} from "../snofall-tv/slede";
import {
  BERGEN_SLUTT,
  GRENSE,
  høyde,
  PORT_BREDDE,
  STEDER,
  type FriHus,
} from "../snofall-tv/vidda";

/** Render units per sim unit; the sim's 900 units/s becomes 90 units/s. */
export const SKALA = 0.1;
/** Render units per track unit (the sim's 450 world units). */
export const SPOR = 45;
/** Tile length along the course, in render units. */
export const FLIS = 100;
const FLIS_BREDDE = 420;

/** The course curves gently; the same bend as the 2D game's curveAt, in render units. */
export const midt = (zSim: number) => Math.sin(zSim / 2600) * 0.3 * SPOR;

/** Sim position (track x, altitude, distance) to world coordinates. Forward is -z. */
export const tilVerden = (xSpor: number, alt: number, zSim: number): Vec3 => [
  xSpor * SPOR + midt(zSim),
  alt * SKALA,
  -zSim * SKALA,
];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const hash = (x: number, z: number) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Valley height at an offset from the course centre (render units, zr = -world z). */
export function terreng(xr: number, zr: number) {
  const d = Math.abs(xr);
  const side = xr < 0 ? -1 : 1;
  let h = 0.6 * Math.sin(xr * 0.11 + zr * 0.05) * smooth(10, 40, d);
  h += 70 * smooth(75, 230, d) + 140 * smooth(180, 420, d);
  h += 14 * Math.sin(zr * 0.023 + side * 1.3) * smooth(90, 200, d);
  h += 9 * Math.sin(zr * 0.051 + xr * 0.03) * smooth(120, 300, d);
  h +=
    (hash(Math.floor(xr / 16), Math.floor(zr / 16)) - 0.5) *
    3 *
    smooth(45, 110, d);
  return h;
}

/** Ground height under a world x at a sim distance. */
export const bakke = (xVerden: number, zSim: number) =>
  terreng(xVerden - midt(zSim), zSim * SKALA);

/** Yaw of the course at a sim distance, so rings and the rig face along the bend. */
export const kursYaw = (zSim: number) =>
  Math.atan2(midt(zSim + 100) - midt(zSim - 100), 20);

/** Free flight: sim position (x, altitude, z; north is -z) to world coordinates, 1 unit = 1 m. */
export const tilVidda = (x: number, alt: number, z: number): Vec3 => [
  x * SKALA,
  alt * SKALA,
  z * SKALA,
];

const SNØ = hex(0xeef3fb);
const SNØ_SKYGGE = hex(0xc0d2ec);
const STEIN = hex(0x4a5060);
const STEIN_LYS = hex(0x6e7585);

// Column spacing grows away from the lane, where nothing is read closely.
const KOLONNER = (() => {
  const xs: number[] = [];
  for (let x = 0; x <= FLIS_BREDDE; x += x < 100 ? 12.5 : x < 250 ? 25 : 42.5)
    xs.push(x);
  if (xs[xs.length - 1] < FLIS_BREDDE) xs.push(FLIS_BREDDE);
  return [
    ...xs
      .slice(1)
      .reverse()
      .map((x) => -x),
    ...xs,
  ];
})();
const RADER = 8;

/** Snow on the flat, stone where it is steep: colour from a triangle's slope. */
const skråfarge = (p: Vec3, q: Vec3, s: Vec3): Vec3 => {
  const ux = q[0] - p[0],
    uy = q[1] - p[1],
    uz = q[2] - p[2];
  const vx = s[0] - p[0],
    vy = s[1] - p[1],
    vz = s[2] - p[2];
  const ny =
    (uz * vx - ux * vz) /
    Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
  const bratt = smooth(0.55, 0.85, Math.abs(ny));
  return [0, 1, 2].map((k) => STEIN[k] + (SNØ[k] - STEIN[k]) * bratt) as Vec3;
};

/** One strip of valley: zr in [i·FLIS, (i+1)·FLIS], the lane bent by midt(). */
export function lagFlis(i: number): Float32Array {
  const m = new Mesh();
  const punkt = (c: number, r: number): Vec3 => {
    const zr = i * FLIS + (r / RADER) * FLIS;
    const xr = KOLONNER[c];
    return [xr + midt(zr / SKALA), terreng(xr, zr), -zr];
  };
  for (let r = 0; r < RADER; r++)
    for (let c = 0; c < KOLONNER.length - 1; c++) {
      const a = punkt(c, r);
      const b = punkt(c + 1, r);
      const d = punkt(c + 1, r + 1);
      const e = punkt(c, r + 1);
      // Winding so normals point up (counter-clockwise seen from above with -z forward).
      m.triangle(a, d, b, skråfarge(a, d, b));
      m.triangle(a, e, d, skråfarge(a, e, d));
    }
  return m.build();
}

const GRAN = hex(0x163d2b);
const GRAN_LYS = hex(0x1f5a3c);
const STAMME = hex(0x5a3f2a);
const TØMMER = hex(0x7a5a3c);
const RØDMALING = hex(0x8a1c1c);
const GULL = hex(0xffd700);
const VINDU = hex(0xffb347);
const ORANSJE = hex(0xff8a3c);
const PELS = hex(0x8f6e4c);
const PELS_MØRK = hex(0x6b4e35);
const PELS_LYS = hex(0xc9b08a);
const RØD = hex(0xc62828);
const GRØNN = hex(0x00ff8a);

/** Spruce, 16 units tall at scale 1 (a sim tree is h = 160). Instanced. */
function treMesh() {
  const m = new Mesh();
  m.rod([0, 0, 0], [0, 4, 0], 0.6, STAMME, 4, 0.4);
  for (let i = 0; i < 3; i++) {
    const y = 2.5 + i * 4;
    const r = 4.2 - i * 1.1;
    m.cone([0, y, 0], r, 6, i % 2 ? GRAN_LYS : GRAN, 6);
    m.cone([0, y + 3.6, 0], r * 0.55, 1.2, SNØ, 6);
  }
  return m.build();
}

export interface HusMesh {
  mesh: Float32Array;
  /** Chimney top in the house's local frame, for Phase 2's deliveries. */
  pipe: Vec3;
}

/** A Snøfall house: timber walls, snowy gable roof, lit windows and a chimney. */
function husMesh(variant: number): HusMesh {
  const m = new Mesh();
  const w = 9 + variant * 2;
  const h = 5 + variant;
  const d = 8 + variant;
  const vegg = variant === 1 ? RØDMALING : TØMMER;
  m.box([0, h / 2, 0], [w, h, d], vegg);
  const topp = h + 4 + variant;
  const r: Vec3[] = [
    [-w / 2 - 0.8, h, -d / 2 - 0.8],
    [w / 2 + 0.8, h, -d / 2 - 0.8],
    [w / 2 + 0.8, h, d / 2 + 0.8],
    [-w / 2 - 0.8, h, d / 2 + 0.8],
  ];
  const møne0: Vec3 = [0, topp, -d / 2 - 0.8];
  const møne1: Vec3 = [0, topp, d / 2 + 0.8];
  m.quad(r[0], møne0, møne1, r[3], SNØ);
  m.quad(r[1], r[2], møne1, møne0, SNØ_SKYGGE);
  m.triangle(r[0], r[1], møne0, vegg);
  m.triangle(r[3], møne1, r[2], vegg);
  // Windows glow; the door is dark wood.
  for (const x of [-w / 4, w / 4]) {
    m.box([x, h * 0.55, d / 2 + 0.05], [1.6, 1.6, 0.1], VINDU, 1);
    m.box([x, h * 0.55, -d / 2 - 0.05], [1.6, 1.6, 0.1], VINDU, 1);
  }
  m.box([w / 2 + 0.05, h * 0.4, 0], [0.1, 2.6, 1.4], STAMME);
  const pipe: Vec3 = [w / 4, topp - 1 + 2.5, 0];
  m.box([pipe[0], topp - 1 + 1.25, 0], [1.4, 2.5, 1.4], STEIN);
  m.box([pipe[0], pipe[1] + 0.2, 0], [1.6, 0.4, 1.6], SNØ);
  return { mesh: m.build(), pipe };
}

/** The ring's opening in render units: exactly the sim's hit ellipse, so what you see is what counts. */
export const RING_RX = RING_X * SPOR;
export const RING_RY = RING_ALT * SKALA;

/**
 * Golden ring in the air, facing the course (the xy plane): a dotted hoop of
 * glowing beads on a thin band, all unlit so it reads through fog from afar.
 */
function ringMesh() {
  const m = new Mesh();
  const n = 16;
  const BÅND = hex(0xc9962a);
  const ved = (i: number): Vec3 => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * RING_RX, Math.sin(a) * RING_RY, 0];
  };
  for (let i = 0; i < n; i++) {
    m.rod(ved(i), ved(i + 1), 0.35, BÅND, 4, 0.35, 1);
    m.box(ved(i), [1.4, 1.4, 1.4], i % 2 ? GULL : VINDU, 1);
  }
  return m.build();
}

/** Letter bird, facing -z: ice-blue body, white wings spread, gold beak, a letter in its claws. */
function fuglMesh() {
  const m = new Mesh();
  const BLÅ = hex(0x8ea4c8);
  m.ellipsoid([0, 0, 0], [0.7, 0.6, 1.2], BLÅ, 6, 3);
  m.ellipsoid([0, 0.5, -1.1], [0.5, 0.5, 0.5], BLÅ, 6, 3);
  m.box([0, 0.45, -1.7], [0.25, 0.2, 0.5], GULL, 1);
  for (const s of [-1, 1]) {
    m.quad(
      [s * 0.4, 0.2, -0.6],
      [s * 2.6, 0.9, -0.2],
      [s * 2.4, 0.9, 0.8],
      [s * 0.4, 0.2, 0.6],
      SNØ,
    );
    m.quad(
      [s * 0.4, 0.2, 0.6],
      [s * 2.4, 0.9, 0.8],
      [s * 2.6, 0.9, -0.2],
      [s * 0.4, 0.2, -0.6],
      SNØ_SKYGGE,
    );
  }
  m.box([0, -0.9, 0], [0.9, 0.1, 0.7], SNØ, 1);
  m.box([0, -0.85, 0], [0.3, 0.12, 0.3], RØD, 1);
  return m.build();
}

function stjerneMesh() {
  const m = new Mesh();
  m.cone([0, 0, 0], 1.4, 1.6, GULL, 4, 0, 1);
  m.cone([0, 0, 0], 1.4, -1.6, GULL, 4, 0, 1);
  return m.build();
}

/** The antenna by the tarn: a tall mast with a red light, the frozen tarn dark beside it. */
function antenneMesh() {
  const m = new Mesh();
  m.rod([0, 0, 0], [0, 32, 0], 0.6, STEIN_LYS, 4, 0.3);
  for (const y of [10, 20, 28])
    m.box([0, y, 0], [5 - y / 10, 0.4, 0.4], STEIN_LYS);
  m.box([0, 33, 0], [1.2, 1.2, 1.2], RØD, 1);
  m.box([-52, 0.05, 0], [40, 0.3, 56], hex(0x1a2448));
  return m.build();
}

/** Padlock over a place that has not opened yet. */
function låsMesh() {
  const m = new Mesh();
  const LÅS = hex(0x9fb0cc);
  m.box([0, 0, 0], [5, 4, 1.6], LÅS, 1);
  for (const s of [-1, 1])
    m.rod([s * 1.6, 2, 0], [s * 1.6, 5, 0], 0.5, LÅS, 4, 0.5, 1);
  m.rod([-1.6, 5, 0], [1.6, 5, 0], 0.5, LÅS, 4, 0.5, 1);
  m.box([0, -0.4, 0.9], [0.8, 1.4, 0.2], STEIN);
  return m.build();
}

/** The aurora gate to Bergen: a green glowing arch across the lane. */
function nordlysportMesh() {
  const m = new Mesh();
  const n = 10;
  const rx = 1.3 * SPOR;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI;
    const a1 = ((i + 1) / n) * Math.PI;
    const p = (a: number, r: number): Vec3 => [
      Math.cos(a) * r,
      Math.sin(a) * 26 * (r / rx),
      0,
    ];
    m.quad(p(a0, rx), p(a0, rx - 6), p(a1, rx - 6), p(a1, rx), GRØNN, 1);
    m.quad(p(a1, rx), p(a1, rx - 6), p(a0, rx - 6), p(a0, rx), GRØNN, 1);
  }
  return m.build();
}

/** Rock peak, 23 units tall (sim h = 230), snow on top. */
function toppMesh() {
  const m = new Mesh();
  m.cone([0, 0, 0], 15, 23, STEIN, 7);
  m.cone([0, 15, 0], 6, 8.5, SNØ, 7);
  return m.build();
}

/** Wall across the valley, 20 units tall, with the open gate at `port` (track units). */
export function murMesh(port: number) {
  const m = new Mesh();
  const px = port * SPOR;
  const halv = 0.4 * SPOR;
  const kant = 1.7 * SPOR;
  m.box([(-kant + px - halv) / 2, 10, 0], [px - halv + kant, 20, 4], STEIN_LYS);
  m.box([(kant + px + halv) / 2, 10, 0], [kant - px - halv, 20, 4], STEIN_LYS);
  for (const s of [-1, 1]) m.box([px + s * halv, 11, 0], [1.5, 22, 5], GULL, 1);
  m.box([px, 20.5, 0], [halv * 2 + 1.5, 1.5, 5], GULL, 1);
  m.box([px, 2, 0], [halv * 2, 4, 1], ORANSJE, 1);
  return m.build();
}

/** The cave: a dark crack in the snow, its edges marked by a dashed line of ice lights. */
export function grotteMesh(lengde: number) {
  const m = new Mesh();
  const l = lengde * SKALA;
  m.box([0, 0.1, -l / 2], [0.8 * SPOR * 2, 0.6, l], hex(0x0b1430));
  for (const s of [-1, 1])
    for (let z = 2; z < l; z += 12)
      m.box([s * 0.8 * SPOR, 0.5, -z], [1.6, 1, 4], SNØ, 1);
  return m.build();
}

/** Aurora band at altitude: a green ribbon the sled flies through for lift. */
function bandMesh() {
  const m = new Mesh();
  const w = 0.6 * SPOR;
  for (let i = -4; i < 4; i++) {
    const x0 = (i / 4) * w;
    const x1 = ((i + 1) / 4) * w;
    const y0 = Math.sin(i * 0.9) * 1.5;
    const y1 = Math.sin((i + 1) * 0.9) * 1.5;
    m.quad(
      [x0, y0 - 2, 0],
      [x1, y1 - 2, 0],
      [x1, y1 + 2, 0],
      [x0, y0 + 2, 0],
      GRØNN,
      1,
    );
    m.quad(
      [x0, y0 + 2, 0],
      [x1, y1 + 2, 0],
      [x1, y1 - 2, 0],
      [x0, y0 - 2, 0],
      GRØNN,
      1,
    );
  }
  return m.build();
}

/**
 * Julius' sleigh, facing -z: red hull with a high swept back and a curled
 * front, gold trim along the sides, a sack of presents, and two gold runners
 * on struts with the tips curling up.
 */
function sledeMesh() {
  const m = new Mesh();
  const MØRKRØD = hex(0x8a1c1c);
  m.box([0, 1.1, 0.4], [4.2, 1.6, 6.6], RØD);
  m.box([0, 2.1, -3.1], [4.2, 2.2, 1], RØD);
  m.box([0, 3.3, -3.6], [4.2, 0.6, 1.2], GULL, 1);
  m.box([0, 2.1, 3.3], [4.2, 1.4, 0.9], MØRKRØD);
  m.box([0, 2.9, 3.3], [4.2, 0.3, 1], GULL, 1);
  m.box([0, 1.9, 2.1], [3.4, 0.5, 1.8], hex(0x1f5a3c));
  for (const x of [-2.15, 2.15]) m.box([x, 1.9, 0.4], [0.3, 0.3, 6.6], GULL, 1);
  m.box([0, 2.5, -0.9], [2.8, 1.8, 2.4], GRAN_LYS);
  m.box([-0.6, 3.6, -1.1], [0.9, 0.9, 0.9], RØD);
  m.box([0.7, 3.5, -0.6], [0.8, 0.8, 0.8], GULL, 1);
  m.box([0.1, 3.8, -1.5], [0.6, 0.6, 0.6], VINDU, 1);
  for (const s of [-1, 1]) {
    const x = s * 1.9;
    m.rod([x, -0.4, 4.2], [x, -0.4, -3.2], 0.3, GULL, 4);
    m.rod([x, -0.4, -3.2], [x, 0.5, -4.5], 0.28, GULL, 4);
    m.rod([x, 0.5, -4.5], [x, 1.9, -5.1], 0.26, GULL, 4);
    m.rod([x, -0.4, 4.2], [x, 0.3, 4.8], 0.26, GULL, 4);
    m.rod([x, -0.4, 2.4], [x, 0.4, 2.4], 0.22, STEIN, 4);
    m.rod([x, -0.4, -1.8], [x, 0.4, -1.8], 0.22, STEIN, 4);
  }
  return m.build();
}

/** A reindeer without legs, facing -z; the lead animal gets a red nose. */
function reinMesh(leder: boolean) {
  const m = new Mesh();
  m.ellipsoid([0, 0, 0], [1, 1.05, 2.1], PELS, 8, 4);
  m.ellipsoid([0, 0.2, 0.5], [0.9, 0.9, 1.3], PELS_MØRK, 8, 4);
  m.rod([0, 0.6, -1.8], [0, 2, -2.8], 0.45, PELS, 5, 0.35);
  m.box([0, 2.3, -3.2], [0.8, 0.8, 1.4], PELS);
  m.box([0, 2.2, -4], [0.5, 0.5, 0.4], leder ? RØD : PELS_MØRK, leder ? 1 : 0);
  m.box([0, 0.3, 2.1], [0.4, 0.5, 0.3], PELS_LYS);
  for (const s of [-1, 1]) {
    const x = s * 0.35;
    m.rod([x, 2.7, -3], [x * 2.4, 4.4, -3.2], 0.12, PELS_LYS, 3);
    m.rod([x * 1.6, 3.6, -3.1], [x * 2.6, 4.2, -2.4], 0.1, PELS_LYS, 3);
    m.rod([x * 1.3, 3.2, -3.1], [x * 1.1, 3.9, -3.9], 0.1, PELS_LYS, 3);
    m.box([s * 0.6, 2.8, -2.9], [0.2, 0.5, 0.3], PELS_MØRK);
  }
  return m.build();
}

/** A present in the air: red box with a gold ribbon and bow. */
function pakkeMesh() {
  const m = new Mesh();
  m.box([0, 0, 0], [1.6, 1.4, 1.6], RØD);
  m.box([0, 0, 0], [1.7, 0.4, 0.5], GULL, 1);
  m.box([0, 0, 0], [0.5, 0.4, 1.7], GULL, 1);
  m.box([0, 0.9, 0], [0.7, 0.5, 0.7], GULL, 1);
  return m.build();
}

/** One puff of chimney smoke, unit size; scaled and lifted per frame. */
function røykMesh() {
  return new Mesh().box([0, 0, 0], [1, 1, 1], hex(0x9fb0cc), 0.6).build();
}

/** Drop aim: a dot along the predicted fall, and the landing cross on the ground. */
function prikkMesh() {
  return new Mesh().box([0, 0, 0], [0.9, 0.9, 0.9], GULL, 1).build();
}
function merkeMesh(farge = GULL) {
  const m = new Mesh();
  m.box([0, 0, 0], [7, 0.4, 1], farge, 1);
  m.box([0, 0, 0], [1, 0.4, 7], farge, 1);
  return m.build();
}

/** Flat dark oval on the snow: shows where a ring or the rig is over the ground. */
function skyggeMesh(b: number, d: number) {
  const m = new Mesh();
  const MØRK = hex(0x5a6378);
  m.box([0, 0, 0], [b, 0.1, d * 0.6], MØRK);
  m.box([0, 0, 0], [b * 0.7, 0.1, d], MØRK);
  return m.build();
}

/** House size from a sim house's chimney height. */
export const husVariant = (h: number) => Math.max(0, HUS_PIPE.indexOf(h));

/** Model matrix for a delivery house on the course: its chimney sits at the sim's (x, z). */
export function husPlass(t: Ting): Mat4 {
  const { pipe } = meshes().hus[husVariant(t.h)];
  const p = tilVerden(t.x, 0, t.z);
  return transform([p[0] - pipe[0], bakke(p[0], t.z) - 0.2, p[2] - pipe[2]]);
}

/** One leg hanging from the hip at the origin; swung by rotating about x. */
function beinMesh() {
  const m = new Mesh();
  m.rod([0, 0, 0], [0, -1.3, 0.2], 0.22, PELS_MØRK, 4, 0.16);
  m.rod([0, -1.3, 0.2], [0, -2.4, -0.1], 0.15, PELS_MØRK, 4, 0.12);
  m.box([0, -2.5, -0.1], [0.3, 0.3, 0.4], hex(0x3a2a1e));
  return m.build();
}

/** Scale of a reindeer relative to the mesh. */
export const REIN_SKALA = 1.25;
/** The team ahead of the sleigh: a pair, then the lead animal in front (forward is -z). */
export const REIN: Vec3[] = [
  [-2.6, 0.9, -10],
  [2.6, 0.9, -10],
  [0, 0.9, -16.5],
];
/** Hip offsets of the four legs in a reindeer's frame. */
export const BEIN: Vec3[] = [
  [-0.6, -0.6, -1.2],
  [0.6, -0.6, -1.2],
  [-0.6, -0.6, 1.2],
  [0.6, -0.6, 1.2],
];

/** Reins from the sleigh front to the pair, and from the pair to the lead animal. */
function tømmerMesh() {
  const m = new Mesh();
  const LÆR = hex(0x3a2a1e);
  const bak = (r: Vec3): Vec3 => [r[0], r[1] + 0.6, r[2] + 2.1 * REIN_SKALA];
  for (const i of [0, 1])
    m.rod([Math.sign(REIN[i][0]) * 1.4, 2, -3.6], bak(REIN[i]), 0.1, LÆR, 3);
  for (const i of [0, 1])
    m.rod(
      [REIN[i][0], REIN[i][1] + 1, REIN[i][2] - 2],
      bak(REIN[2]),
      0.08,
      LÆR,
      3,
    );
  return m.build();
}

export interface Meshes {
  tre: Float32Array;
  hus: HusMesh[];
  ring: Float32Array;
  fugl: Float32Array;
  stjerne: Float32Array;
  topp: Float32Array;
  band: Float32Array;
  antenne: Float32Array;
  lås: Float32Array;
  nordlysport: Float32Array;
  slede: Float32Array;
  rein: [Float32Array, Float32Array];
  bein: Float32Array;
  tømmer: Float32Array;
  pakke: Float32Array;
  røyk: Float32Array;
  prikk: Float32Array;
  merke: Float32Array;
  /** Green cross over a house that got a close (not chimney) delivery. */
  merkeNær: Float32Array;
  skygge: Float32Array;
  ringSkygge: Float32Array;
}

let cache: Meshes | null = null;
/** Every static mesh, built once per page. */
export function meshes(): Meshes {
  if (!cache)
    cache = {
      tre: treMesh(),
      hus: [0, 1, 2].map(husMesh),
      ring: ringMesh(),
      fugl: fuglMesh(),
      stjerne: stjerneMesh(),
      topp: toppMesh(),
      band: bandMesh(),
      antenne: antenneMesh(),
      lås: låsMesh(),
      nordlysport: nordlysportMesh(),
      slede: sledeMesh(),
      rein: [reinMesh(true), reinMesh(false)],
      bein: beinMesh(),
      tømmer: tømmerMesh(),
      pakke: pakkeMesh(),
      røyk: røykMesh(),
      prikk: prikkMesh(),
      merke: merkeMesh(),
      merkeNær: merkeMesh(GRØNN),
      skygge: skyggeMesh(4, 9),
      ringSkygge: skyggeMesh(RING_RX * 2, 1.6),
    };
  return cache;
}

export const nøkkel = (t: Ting) => `${t.type}:${t.z}`;

export interface Hus {
  pos: Vec3;
  rot: number;
  variant: number;
  /** Chimney top in world space (Phase 2 drops presents here). */
  pipe: Vec3;
  /** Distance along the course, for culling. */
  zSim: number;
}

export interface Verden {
  etappe: SledeEtappe;
  hus: Hus[];
  /** Tree instances: x, y, z, scale; decorative slope trees plus the course's obstacles. */
  trær: Float32Array;
  /** Mesh per wall and cave, keyed by nøkkel(ting); the sim holds its own Ting objects. */
  spesial: Map<string, Float32Array>;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Houses and trees for a stage: Snøfall at the start, farms along the way, a hamlet at the finish. */
export function lagVerden(e: SledeEtappe): Verden {
  let seed = 7;
  for (const c of e.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  const hus: Hus[] = [];
  const settHus = (zSim: number, side: number) => {
    const variant = Math.floor(r() * 3);
    const xr = side * (70 + r() * 36);
    const x = xr + midt(zSim);
    const y = terreng(xr, zSim * SKALA);
    const rot = (-side * Math.PI) / 2 + (r() - 0.5) * 0.6;
    const { pipe } = meshes().hus[variant];
    const m = transform([x, y, -zSim * SKALA], [0, rot, 0]);
    const px = m[0] * pipe[0] + m[4] * pipe[1] + m[8] * pipe[2] + m[12];
    const py = m[1] * pipe[0] + m[5] * pipe[1] + m[9] * pipe[2] + m[13];
    const pz = m[2] * pipe[0] + m[6] * pipe[1] + m[10] * pipe[2] + m[14];
    hus.push({
      pos: [x, y, -zSim * SKALA],
      rot,
      variant,
      pipe: [px, py, pz],
      zSim,
    });
  };
  for (let z = -900; z < 1300; z += 260)
    for (const s of [-1, 1]) if (r() < 0.8) settHus(z + r() * 120, s);
  for (let z = 3000; z < e.lengde - 2500; z += 1500)
    if (r() < 0.45) settHus(z, r() < 0.5 ? -1 : 1);
  for (let z = e.lengde - 1200; z < e.lengde + 900; z += 300)
    for (const s of [-1, 1]) if (r() < 0.7) settHus(z + r() * 120, s);

  const trær: number[] = [];
  const tett = 0.5 + e.blanding.tre;
  for (let zr = -120; zr < e.lengde * SKALA + 120; zr += 22) {
    for (const side of [-1, 1]) {
      const n = Math.floor(r() * 3 * tett);
      for (let i = 0; i < n; i++) {
        const xr = side * (66 + r() * 190);
        const zz = zr + r() * 22;
        const s = 0.55 + r() * 0.75;
        trær.push(xr + midt(zz / SKALA), terreng(xr, zz) - 0.3, -zz, s);
      }
    }
  }
  const spesial = new Map<string, Float32Array>();
  for (const t of lagBane(e)) {
    if (t.type === "tre") {
      const p = tilVerden(t.x, 0, t.z);
      trær.push(p[0], bakke(p[0], t.z) - 0.3, p[2], t.h / 160);
    } else if (t.type === "mur") spesial.set(nøkkel(t), murMesh(t.port ?? 0));
    else if (t.type === "grotte")
      spesial.set(nøkkel(t), grotteMesh(t.lengde ?? 1600));
  }
  return { etappe: e, hus, trær: new Float32Array(trær), spesial };
}

/* ---- Fri flyging: the open vidda ---- */

/** Square terrain tile in render units; the near world is RUTE_N cells per side. */
export const RUTE = 200;
const RUTE_N = 10;
/** One cell of the coarse horizon mesh, in render units. */
const FJERN_CELLE = 80;

/** A square of the vidda at tile (ix, iz), with the trees that grow on it. */
export function lagRute(
  ix: number,
  iz: number,
): { mesh: Float32Array; trær: Float32Array } {
  const m = new Mesh();
  const punkt = (c: number, r: number): Vec3 => {
    const x = (ix + c / RUTE_N) * RUTE;
    const z = (iz + r / RUTE_N) * RUTE;
    return [x, høyde(x / SKALA, z / SKALA) * SKALA, z];
  };
  for (let r = 0; r < RUTE_N; r++)
    for (let c = 0; c < RUTE_N; c++) {
      const a = punkt(c, r);
      const b = punkt(c + 1, r);
      const d = punkt(c + 1, r + 1);
      const e = punkt(c, r + 1);
      // The tile's +z is south, so the winding is mirrored from lagFlis to keep normals up.
      m.triangle(a, b, d, skråfarge(a, b, d));
      m.triangle(a, d, e, skråfarge(a, d, e));
    }
  // Forests in patches, thinning on the heights, none in the villages or Bergen's streets.
  const trær: number[] = [];
  const tett = smooth(0.35, 0.75, hash(Math.floor(ix / 2), Math.floor(iz / 2)));
  const n = Math.floor(tett * 26);
  for (let i = 0; i < n; i++) {
    const x = (ix + hash(ix * 7 + i, iz)) * RUTE;
    const z = (iz + hash(ix, iz * 5 + i)) * RUTE;
    const xs = x / SKALA;
    const zs = z / SKALA;
    const h = høyde(xs, zs);
    if (h > 120) continue;
    if (
      STEDER.some(
        (s) => s.id !== "muren" && Math.hypot(xs - s.x, zs - s.z) < s.r * 0.7,
      )
    )
      continue;
    if (zs > GRENSE - 500 && Math.abs(xs) < PORT_BREDDE + 400) continue;
    trær.push(x, h * SKALA - 0.3, z, 0.6 + hash(i, ix + iz) * 0.7);
  }
  return { mesh: m.build(), trær: new Float32Array(trær) };
}

/** The whole vidda and the Bergen corridor as one coarse mesh for the horizon beyond the near tiles. */
export function fjernMesh(): Float32Array {
  const m = new Mesh();
  const rand = (GRENSE + 6000) * SKALA;
  const sør = (BERGEN_SLUTT + 4000) * SKALA;
  const p = (x: number, z: number): Vec3 => [
    x,
    høyde(x / SKALA, z / SKALA) * SKALA - 1.5,
    z,
  ];
  for (let z = -rand; z < sør; z += FJERN_CELLE)
    for (let x = -rand; x < rand; x += FJERN_CELLE) {
      const a = p(x, z);
      const b = p(x + FJERN_CELLE, z);
      const d = p(x + FJERN_CELLE, z + FJERN_CELLE);
      const e = p(x, z + FJERN_CELLE);
      m.triangle(a, b, d, skråfarge(a, b, d));
      m.triangle(a, d, e, skråfarge(a, d, e));
    }
  return m.build();
}

/**
 * The aurora curtain at the edge of the vidda: tall green rays around the circle,
 * with the gate's stretch left out once Bergen is open.
 */
export function gardinMesh(bergen: boolean): Float32Array {
  const m = new Mesh();
  const r = GRENSE * SKALA;
  const n = 180;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.sin(a) * r;
    const z = Math.cos(a) * r;
    if (bergen && z > 0 && Math.abs(x) < PORT_BREDDE * SKALA + 30) continue;
    const h = 70 + ((i * 7) % 5) * 16;
    const w = 5;
    const dx = Math.cos(a) * w;
    const dz = -Math.sin(a) * w;
    const farge = i % 2 ? GRØNN : hex(0x5ef0b8);
    m.quad(
      [x - dx, 0, z - dz],
      [x + dx, 0, z + dz],
      [x + dx, h, z + dz],
      [x - dx, h, z - dz],
      farge,
      1,
    );
  }
  return m.build();
}

/** Model matrix for a house on the vidda: its chimney stands at the house's (x, z). */
export function husPlassFri(h: FriHus): Mat4 {
  const { pipe } = meshes().hus[h.variant];
  const x = h.x * SKALA - pipe[0] * Math.cos(h.rot);
  const z = h.z * SKALA + pipe[0] * Math.sin(h.rot);
  return transform([x, høyde(h.x, h.z) * SKALA - 0.2, z], [0, h.rot, 0]);
}

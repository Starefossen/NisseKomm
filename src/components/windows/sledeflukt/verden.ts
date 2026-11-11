/**
 * SLEDEFLUKT: the 3D world around the pure sim in snofall-tv/slede.ts.
 * The sim keeps its units (x in track units, altitude and z in sim units); this
 * module maps them to render units (SKALA) and builds every mesh: valley tiles,
 * trees, Snøfall houses with chimneys, the things on the course and the rig.
 * Nothing here touches the DOM or WebGL, so it is testable.
 */

import { hex, Mesh, transform, type Vec3 } from "./gl";
import { lagBane, type SledeEtappe, type Ting } from "../snofall-tv/slede";

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
      const farge = (p: Vec3, q: Vec3, s: Vec3): Vec3 => {
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
        return [0, 1, 2].map(
          (k) => STEIN[k] + (SNØ[k] - STEIN[k]) * bratt,
        ) as Vec3;
      };
      // Winding so normals point up (counter-clockwise seen from above with -z forward).
      m.triangle(a, d, b, farge(a, d, b));
      m.triangle(a, e, d, farge(a, e, d));
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

/** Beacon: stone cairn, a lantern and a tall light so it reads from afar. */
function vardeMesh() {
  const m = new Mesh();
  m.cone([0, 0, 0], 2.4, 1.6, STEIN, 6, 1.8);
  m.cone([0, 1.6, 0], 1.8, 1.4, STEIN_LYS, 6, 1.2);
  m.cone([0, 3, 0], 1.2, 1.2, STEIN, 6, 0.7);
  m.box([0, 4.8, 0], [1.2, 1.2, 1.2], ORANSJE, 1);
  m.box([0, 12, 0], [0.5, 14, 0.5], VINDU, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    m.box([Math.cos(a) * 7, 10, Math.sin(a) * 7], [1, 1, 1], GULL, 1);
  }
  return m.build();
}

function stjerneMesh() {
  const m = new Mesh();
  m.cone([0, 0, 0], 1.4, 1.6, GULL, 4, 0, 1);
  m.cone([0, 0, 0], 1.4, -1.6, GULL, 4, 0, 1);
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

/** The cave: a dark crack in the snow with a faint glow along the edges. */
function grotteMesh(lengde: number) {
  const m = new Mesh();
  const l = lengde * SKALA;
  m.box([0, 0.1, -l / 2], [0.8 * SPOR * 2, 0.6, l], hex(0x050816));
  for (const s of [-1, 1])
    m.box([s * 0.8 * SPOR, 0.2, -l / 2], [1.2, 0.4, l], hex(0x00ff8a), 1);
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

/** Julius' sleigh, facing -z: red body, gold rail, runners curling up at the front. */
function sledeMesh() {
  const m = new Mesh();
  m.box([0, 0.9, 0.3], [3.6, 1.6, 6], RØD);
  m.box([0, 1.9, 2.4], [3.6, 1.2, 1.2], RØDMALING);
  m.box([0, 1.75, -1.5], [3.7, 0.3, 2.6], GULL);
  m.box([0, 1.4, -0.5], [2.4, 1.6, 2.2], hex(0x1f5a3c));
  for (const s of [-1, 1]) {
    const x = s * 1.6;
    m.rod([x, -0.3, 3.2], [x, -0.3, -2.6], 0.22, GULL, 4);
    m.rod([x, -0.3, -2.6], [x, 1.1, -4.2], 0.2, GULL, 4);
    m.rod([x, -0.3, 1], [x, 0.4, 1], 0.18, GULL, 4);
    m.rod([x, -0.3, -1.6], [x, 0.4, -1.6], 0.18, GULL, 4);
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

/** One leg hanging from the hip at the origin; swung by rotating about x. */
function beinMesh() {
  const m = new Mesh();
  m.rod([0, 0, 0], [0, -1.3, 0.2], 0.22, PELS_MØRK, 4, 0.16);
  m.rod([0, -1.3, 0.2], [0, -2.4, -0.1], 0.15, PELS_MØRK, 4, 0.12);
  m.box([0, -2.5, -0.1], [0.3, 0.3, 0.4], hex(0x3a2a1e));
  return m.build();
}

/** Reindeer positions ahead of the sleigh (world z offsets, forward is -z). */
export const REIN_Z = [9, 14.5, 20];
/** Hip offsets of the four legs in a reindeer's frame. */
export const BEIN: Vec3[] = [
  [-0.6, -0.6, -1.2],
  [0.6, -0.6, -1.2],
  [-0.6, -0.6, 1.2],
  [0.6, -0.6, 1.2],
];

/** Reins from the sleigh front to each reindeer. */
function tømmerMesh() {
  const m = new Mesh();
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++)
      m.rod(
        [s * 1.2, 1.2, -3 - i * 5.4],
        [s * 0.8, 1.5, -(REIN_Z[i] - 1.2)],
        0.07,
        hex(0x3a2a1e),
        3,
      );
  return m.build();
}

export interface Meshes {
  tre: Float32Array;
  hus: HusMesh[];
  varde: Float32Array;
  stjerne: Float32Array;
  topp: Float32Array;
  band: Float32Array;
  slede: Float32Array;
  rein: [Float32Array, Float32Array];
  bein: Float32Array;
  tømmer: Float32Array;
}

let cache: Meshes | null = null;
/** Every static mesh, built once per page. */
export function meshes(): Meshes {
  if (!cache)
    cache = {
      tre: treMesh(),
      hus: [0, 1, 2].map(husMesh),
      varde: vardeMesh(),
      stjerne: stjerneMesh(),
      topp: toppMesh(),
      band: bandMesh(),
      slede: sledeMesh(),
      rein: [reinMesh(true), reinMesh(false)],
      bein: beinMesh(),
      tømmer: tømmerMesh(),
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

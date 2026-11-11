/**
 * Snøfall in free flight: the round village wall with its south gate and four
 * onion-domed turrets, the clock tower, the named houses, booths and trodden
 * streets, as one static mesh in render units (ground is flat inside the tun).
 * Layout and collision live in snofall-tv/vidda.ts (TUN, BYGG, bygg()); the
 * ring houses with chimneys are FriHus from lagHus and drawn as houses.
 */

import { hex, Mesh, transform, type Vec3 } from "./gl";
import { BYGG, lagHus, TUN, type Bygg } from "../snofall-tv/vidda";
import { SKALA } from "./verden";

const STEIN = hex(0x6a6258);
const STEIN_MØRK = hex(0x4e4840);
const SNØ = hex(0xeef3fb);
const SNØ_SKYGGE = hex(0xc0d2ec);
const PALISADE = hex(0x7a7468);
const EIK = hex(0x3a2a1c);
const TØMMER = hex(0x7a5a3c);
const GAMMELT = hex(0x4f4a44);
const RØD = hex(0x9a2222);
const OKER = hex(0xb07a2a);
const MØRKGRØNN = hex(0x2f4a3a);
const GULLTRE = hex(0xc9962a);
const VINDU = hex(0xffb347);
const GLØD = hex(0xffd27a);
const GRØNTLYS = hex(0x7dffb0);
const SPOR = hex(0xc8d4e6);
const MESSING = hex(0xd8b04a);
const URSKIVE = hex(0xfff4d6);

const S = SKALA;
/** Top of the main house's spire, sim units. */
const SPIR = 520;
const VED = hex(0x8a6440);
const GRAN = hex(0x1f5a3c);
const LYSPÆRE = [hex(0xff4a3c), hex(0xffd700), hex(0x7dd0ff)];

const HUS = lagHus(false);

/** Is (x, z) clear of named buildings, ring houses, streets and the wall, by `m` sim units? */
function ledig(x: number, z: number, m: number) {
  const d = Math.hypot(x, z);
  if (d > TUN.r - 80 - m || d < 380) return false;
  if (Math.abs(x) < 60 + m && z > 0) return false;
  if (Math.abs(d - 800) < 30 + m) return false;
  if (
    BYGG.some(
      (b) => Math.abs(x - b.x) < b.b / 2 + m && Math.abs(z - b.z) < b.d / 2 + m,
    )
  )
    return false;
  return !HUS.some(
    (h) => Math.hypot(h.x - x, h.z - z) < (130 * (h.sk ?? 1)) / 2 + m + 60,
  );
}

/**
 * Small spruces round the tun, as [x, y, z, scale] instances of verden's tree mesh
 * (render units); their fairy lights are baked into snofallMesh.
 */
export const PYNTETRÆR: Float32Array = (() => {
  const ut: number[] = [];
  for (let i = 0; i < 400 && ut.length < 18 * 4; i++) {
    const a = i * 2.39996;
    const r = 420 + ((i * 97) % 1000);
    const x = Math.sin(a) * r;
    const z = -Math.cos(a) * r;
    if (!ledig(x, z, 40)) continue;
    ut.push(x * S, 0, z * S, 0.45);
  }
  return new Float32Array(ut);
})();

/**
 * A gabled house at sim (x, z), footprint b×d and ridge height h (sim units);
 * the ridge runs along z unless `mønX`. Windows glow on the long sides.
 */
function hus(
  m: Mesh,
  b: Bygg,
  vegg: Vec3,
  mønX = false,
  vinduer = 2,
  glow = VINDU,
) {
  const l = new Mesh();
  const w = (mønX ? b.d : b.b) * S;
  const d = (mønX ? b.b : b.d) * S;
  const h = b.h * S;
  const hv = h * 0.6;
  l.box([0, hv / 2, 0], [w, hv, d], vegg);
  const r: Vec3[] = [
    [-w / 2 - 0.8, hv, -d / 2 - 0.8],
    [w / 2 + 0.8, hv, -d / 2 - 0.8],
    [w / 2 + 0.8, hv, d / 2 + 0.8],
    [-w / 2 - 0.8, hv, d / 2 + 0.8],
  ];
  const m0: Vec3 = [0, h, -d / 2 - 0.8];
  const m1: Vec3 = [0, h, d / 2 + 0.8];
  l.quad(r[0], m0, m1, r[3], SNØ);
  l.quad(r[1], r[2], m1, m0, SNØ_SKYGGE);
  l.triangle(
    [-w / 2, hv, -d / 2],
    [w / 2, hv, -d / 2],
    [0, h - 0.6, -d / 2],
    vegg,
  );
  l.triangle(
    [-w / 2, hv, d / 2],
    [0, h - 0.6, d / 2],
    [w / 2, hv, d / 2],
    vegg,
  );
  for (let i = 0; i < vinduer; i++) {
    const z = ((i + 0.5) / vinduer - 0.5) * d;
    for (const s of [-1, 1])
      l.box([s * (w / 2 + 0.05), hv * 0.55, z], [0.1, 1.6, 1.6], glow, 1);
  }
  // A gable window too, so lit houses read from the tun.
  l.box([0, hv * 0.55, d / 2 + 0.05], [1.6, 1.6, 0.1], glow, 1);
  m.append(
    l.build(),
    transform([b.x * S, 0, b.z * S], [0, mønX ? Math.PI / 2 : 0, 0]),
  );
}

function mur(m: Mesh) {
  const r0 = (TUN.r - TUN.tykk) * S;
  const r1 = (TUN.r + TUN.tykk) * S;
  const hs = TUN.h * S * 0.65;
  const hp = TUN.h * S;
  const gap = TUN.portHalv / TUN.r;
  const n = 64;
  // Bearing a: north is -z; the gate is at bearing π (due south).
  const ved = (a: number, r: number, y: number): Vec3 => [
    Math.sin(a) * r,
    y,
    -Math.cos(a) * r,
  ];
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + gap + ((Math.PI * 2 - gap * 2) * i) / n;
    const a1 = Math.PI + gap + ((Math.PI * 2 - gap * 2) * (i + 1)) / n;
    const farge = i % 2 ? STEIN : STEIN_MØRK;
    m.quad(
      ved(a0, r1, 0),
      ved(a0, r1, hs),
      ved(a1, r1, hs),
      ved(a1, r1, 0),
      farge,
    );
    m.quad(
      ved(a1, r0, 0),
      ved(a1, r0, hs),
      ved(a0, r0, hs),
      ved(a0, r0, 0),
      farge,
    );
    m.quad(
      ved(a0, r0, hs),
      ved(a0, r1, hs),
      ved(a1, r1, hs),
      ved(a1, r0, hs),
      SNØ,
    );
    // Palisade on top, both sides drawn.
    const rp = (r0 + r1) / 2;
    m.quad(
      ved(a0, rp, hs),
      ved(a0, rp, hp),
      ved(a1, rp, hp),
      ved(a1, rp, hs),
      PALISADE,
    );
    m.quad(
      ved(a1, rp, hs),
      ved(a1, rp, hp),
      ved(a0, rp, hp),
      ved(a0, rp, hs),
      PALISADE,
    );
  }
  // Turrets: round stone towers with a lit window and an onion dome.
  for (const a of TUN.tårn) {
    const c = ved(a, TUN.r * S, 0);
    const rt = TUN.tårnR * S;
    const ht = TUN.tårnH * S;
    m.cone(c, rt, ht, STEIN, 8, rt * 0.92);
    const v = ved(a, (TUN.r - TUN.tårnR) * S - 0.1, ht * 0.7);
    m.box(v, [1.2, 1.8, 1.2], VINDU, 1);
    m.ellipsoid([c[0], ht + 2.2, c[2]], [rt * 1.15, 3, rt * 1.15], SNØ, 8, 4);
    m.cone([c[0], ht + 4.6, c[2]], 0.9, 3.4, SNØ_SKYGGE, 4);
  }
}

/** The gatehouse due south: stone pylons, timber gable, crossed dragon heads, wings open outward. */
function port(m: Mesh) {
  const z = TUN.r * S;
  const pw = TUN.port * S;
  const hw = TUN.portHalv * S;
  const ph = TUN.portH * S;
  const gh = TUN.gavl * S;
  const dyp = 6;
  for (const s of [-1, 1]) {
    m.box([(s * (pw + hw)) / 2, ph / 2, z], [hw - pw, ph, dyp], STEIN);
    // Warm light on the opening's sides.
    m.box([s * (pw - 0.06), ph * 0.4, z], [0.1, ph * 0.7, dyp * 0.8], VINDU, 1);
  }
  m.box([0, ph + 1.5, z], [hw * 2, 3, dyp], STEIN_MØRK);
  m.box([0, ph - 0.1, z], [pw * 2, 0.2, dyp * 0.8], GLØD, 1);
  // Timber gable on the stone, ridge north–south, snow on the roof.
  const y0 = ph + 3;
  const ry = gh;
  const v = hw + 0.6;
  const zf = z + dyp / 2 + 0.6;
  const zb = z - dyp / 2 - 0.6;
  m.box([0, y0 + 2, z], [hw * 2 - 1, 4, dyp - 0.4], TØMMER);
  m.quad([-v, y0 + 4, zb], [0, ry, zb], [0, ry, zf], [-v, y0 + 4, zf], SNØ);
  m.quad(
    [v, y0 + 4, zb],
    [v, y0 + 4, zf],
    [0, ry, zf],
    [0, ry, zb],
    SNØ_SKYGGE,
  );
  for (const zz of [zf - 0.6, zb + 0.6]) {
    const f = zz > z ? 1 : -1;
    const a: Vec3 = [-hw + 0.5, y0 + 4, zz];
    const b: Vec3 = [hw - 0.5, y0 + 4, zz];
    const t: Vec3 = [0, ry - 0.4, zz];
    if (f > 0) m.triangle(a, b, t, TØMMER);
    else m.triangle(a, t, b, TØMMER);
    // Two dragon heads crossing over each ridge end.
    for (const s of [-1, 1])
      m.rod(
        [s * 1.5, ry - 1.5, zz + f * 0.5],
        [-s * 2.5, ry + 3, zz + f * 1.5],
        0.35,
        EIK,
        4,
        0.1,
      );
  }
  // Heavy oak wings swung outward from hinges at the opening's sides, iron-banded.
  for (const s of [-1, 1]) {
    const l = new Mesh();
    l.box([-s * pw * 0.5, 0, 0], [pw, ph * 0.9, 0.5], EIK);
    for (const y of [-ph * 0.25, ph * 0.25])
      l.box([-s * pw * 0.5, y, 0.3], [pw, 0.4, 0.1], STEIN_MØRK);
    m.append(
      l.build(),
      transform([s * pw, ph * 0.45, z + dyp / 2], [0, s * 1.1, 0]),
    );
  }
  // Two lanterns on posts outside.
  for (const s of [-1, 1]) {
    const x = s * (hw + 4);
    m.rod([x, 0, z + 10], [x, 4, z + 10], 0.2, EIK, 4);
    m.box([x, 4.4, z + 10], [0.9, 0.9, 0.9], GLØD, 1);
  }
}

function klokketårn(m: Mesh, b: Bygg) {
  const x = b.x * S;
  const z = b.z * S;
  const r = (b.b / 2) * S * Math.SQRT2;
  const kropp = b.h * S * 0.72;
  m.cone([x, 0, z], r, kropp, GULLTRE, 4, r * 0.7);
  // Four clock faces, then the lit lantern room seen from all over Snøfall.
  const rt = r * 0.7;
  const fe = rt / Math.SQRT2;
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    m.box(
      [x + dx * (fe + 0.05), kropp - 2, z + dz * (fe + 0.05)],
      [dz ? 2 : 0.1, 2, dx ? 2 : 0.1],
      URSKIVE,
      1,
    );
  m.box([x, kropp + 1.2, z], [fe * 1.6, 2.4, fe * 1.6], GLØD, 1);
  m.ellipsoid([x, kropp + 3.2, z], [fe * 1.1, 1.8, fe * 1.1], GULLTRE, 6, 3);
  m.cone([x, kropp + 4.4, z], 0.6, b.h * S - kropp - 4.4, MESSING, 4);
}

function hovedhus(m: Mesh, b: Bygg) {
  hus(m, b, RØD, false, 4);
  const x = b.x * S;
  const zf = (b.z + b.d / 2) * S;
  // Veranda and stairs down to the square, an arched window, and the spire.
  m.box([x, 1.2, zf + 2], [b.b * S * 0.6, 0.4, 4], TØMMER);
  for (let i = 0; i < 3; i++)
    m.box([x, 0.4 * i + 0.2, zf + 4.5 + i * 0.8], [6, 0.4, 0.8], SNØ_SKYGGE);
  m.box([x, b.h * S * 0.45, zf + 0.06], [3, 3, 0.1], VINDU, 1);
  m.cone([x, b.h * S - 2, b.z * S], 2.6, SPIR * S - b.h * S + 2, RØD, 6);
  m.box([x, SPIR * S, b.z * S], [0.9, 0.9, 0.9], GLØD, 1);
}

function bod(m: Mesh, b: Bygg) {
  const x = b.x * S;
  const z = b.z * S;
  const w = b.b * S;
  const d = b.d * S;
  const h = b.h * S;
  // Open front facing the tower.
  const yaw = Math.atan2(-x, -z);
  const l = new Mesh();
  l.box([0, h * 0.35, -d / 2 + 0.2], [w, h * 0.7, 0.4], TØMMER);
  for (const s of [-1, 1])
    l.box([s * (w / 2 - 0.2), h * 0.35, 0], [0.4, h * 0.7, d], TØMMER);
  l.box([0, 0.5, d / 2 - 0.4], [w, 1, 0.6], TØMMER);
  l.box([0, h * 0.8, 0], [w + 1, 0.6, d + 1], SNØ);
  for (let i = 0; i < 4; i++)
    l.box(
      [(i / 3 - 0.5) * w, h * 0.7, d / 2 + 0.4],
      [0.35, 0.35, 0.35],
      GLØD,
      1,
    );
  m.append(l.build(), transform([x, 0, z], [0, yaw, 0]));
}

/** Trodden snow: the main street gate → square → main house, the square's ring and the ring street. */
function spor(m: Mesh) {
  const y = 0.15;
  const ring = (r: number, w: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const p = (a: number, rr: number): Vec3 => [
        Math.sin(a) * rr * S,
        y,
        -Math.cos(a) * rr * S,
      ];
      m.quad(p(a0, r - w), p(a1, r - w), p(a1, r + w), p(a0, r + w), SPOR);
    }
  };
  ring(800, 7.5, 32);
  ring(350, 10, 24);
  m.quad(
    [-1, y, TUN.r * S + 8],
    [1, y, TUN.r * S + 8],
    [1, y, -80],
    [-1, y, -80],
    SPOR,
  );
}

/** Lamp posts, fences, a Christmas tree on the square, lights on the spruces, stall clutter. */
function pynt(m: Mesh) {
  const lampe = (x: number, z: number) => {
    m.rod([x * S, 0, z * S], [x * S, 4.5, z * S], 0.15, EIK, 4);
    m.box([x * S, 4.9, z * S], [0.8, 0.8, 0.8], GLØD, 1);
  };
  for (let z = 420; z < TUN.r - 60; z += 170)
    for (const s of [-1, 1]) lampe(s * 45, z);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    lampe(Math.sin(a) * 375, -Math.cos(a) * 375);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    lampe(Math.sin(a) * 840, -Math.cos(a) * 840);
  }
  // Picket fences along the main street, from the ring street (r 800) towards
  // the gate, so no fence crosses the ring street.
  const [f0, f1] = [(800 + 7.5 + 10) * S, 1210 * S];
  for (const s of [-1, 1]) {
    const x = s * 70 * S;
    for (const y of [0.6, 1.2])
      m.box([x, y, (f0 + f1) / 2], [0.15, 0.15, f1 - f0], PALISADE);
    for (let z = Math.ceil(f0); z <= f1; z += 4)
      m.box([x, 0.7, z], [0.2, 1.4, 0.2], PALISADE);
  }
  // The Christmas tree on the square, south of the tower, lit.
  const [jx, jz] = [-150 * S, 200 * S];
  m.rod([jx, 0, jz], [jx, 2, jz], 0.5, EIK, 4);
  for (let i = 0; i < 4; i++)
    m.cone([jx, 2 + i * 3.4, jz], 5 - i * 1.1, 5, GRAN, 8);
  m.box([jx, 16.4, jz], [1.2, 1.2, 1.2], hex(0xffd700), 1);
  for (let i = 0; i < 24; i++) {
    const y = 2.5 + (i / 24) * 12;
    const r = 5 - (y - 2) * 0.33;
    const a = i * 2.4;
    m.box(
      [jx + Math.cos(a) * r, y, jz + Math.sin(a) * r],
      [0.45, 0.45, 0.45],
      LYSPÆRE[i % 3],
      1,
    );
  }
  for (let i = 0; i < PYNTETRÆR.length; i += 4) {
    const [x, z] = [PYNTETRÆR[i], PYNTETRÆR[i + 2]];
    for (let k = 0; k < 4; k++) {
      const a = k * 1.7 + i;
      m.box(
        [x + Math.cos(a) * 1.3, 2.5 + k * 1.4, z + Math.sin(a) * 1.3],
        [0.35, 0.35, 0.35],
        LYSPÆRE[k % 3],
        1,
      );
    }
  }
  // By each stall: a barrel, a crate, and a woodpile or a little sled.
  BYGG.filter((b) => b.id === "bod").forEach((b, i) => {
    const sx = b.x > 0 ? 1 : -1;
    const x = (b.x + sx * (b.b / 2 + 14)) * S;
    const z = b.z * S;
    m.cone([x, 0, z - 1.2], 0.6, 1.4, VED, 6, 0.6);
    m.box([x, 0.5, z + 1], [1, 1, 1], TØMMER);
    if (i % 2) {
      m.box([x + sx * 2, 0.6, z], [1.2, 1.2, 3], VED);
      m.box([x + sx * 2, 1.25, z], [1.3, 0.2, 3.1], SNØ);
    } else {
      m.box([x + sx * 2.2, 0.5, z], [1, 0.25, 2], RØD);
      for (const k of [-0.45, 0.45])
        m.box([x + sx * 2.2 + k, 0.2, z], [0.1, 0.4, 2.3], EIK);
    }
  });
}

/** Snøfall's static mesh, built once. */
let cache: Float32Array | null = null;
export function snofallMesh(): Float32Array {
  if (cache) return cache;
  const m = new Mesh();
  mur(m);
  port(m);
  spor(m);
  pynt(m);
  for (const b of BYGG) {
    switch (b.id) {
      case "klokketaarn":
        klokketårn(m, b);
        break;
      case "hovedhus":
        hovedhus(m, b);
        break;
      case "postkasse":
        m.rod([b.x * S, 0, b.z * S], [b.x * S, 1.2, b.z * S], 0.12, EIK, 4);
        m.box([b.x * S, 1.6, b.z * S], [1, 0.9, 0.7], RØD);
        m.box([b.x * S, 2.1, b.z * S], [1.1, 0.12, 0.8], MESSING);
        break;
      case "pakkesentral":
        hus(m, b, TØMMER, true, 3, GRØNTLYS);
        break;
      case "gront":
        hus(m, b, MØRKGRØNN, false, 2);
        break;
      case "kafe":
        hus(m, b, OKER, true, 2);
        m.box([(b.x + 30) * S, b.h * S, b.z * S], [1.4, 3, 1.4], STEIN);
        break;
      case "iq":
        hus(m, b, GAMMELT, false, 1, hex(0x8fd8ff));
        break;
      case "bod":
        bod(m, b);
        break;
    }
  }
  cache = m.build();
  return cache;
}

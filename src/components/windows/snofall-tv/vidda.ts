/**
 * Fri flyging: the open vidda around Snøfall as a pure simulation. No track:
 * the sled has a position (x, z in sim units, 0.1 m each; north is -z), an
 * altitude and a heading (kurs, radians clockwise from north). Places open
 * with the story, locked ones push the sled out, the aurora curtain at the
 * edge turns it back, and terrain is an obstacle. Nothing here touches the DOM.
 */

import {
  ALT_MAX,
  STYRE_TREGHET,
  SKADE_PER_TREFF,
  HUS_PIPE,
  nærPoeng,
  NÆR_M,
  PIPE_POENG,
  åpnerTekst,
  AERO,
  type Styring,
} from "./slede";

/** Radius of the vidda; the aurora curtain hangs here. */
export const GRENSE = 22000;
/** Half-width of the corridor through the curtain gate to Bergen, and where it ends (along the corridor). */
export const PORT_BREDDE = 1400;
export const BERGEN_SLUTT = GRENSE + 15000;
export const FART = 800;
export const ALT_MIN = 60;
/** Above the roofs and the gate's gable at the start (Hans, 2026-11-11). */
export const ALT_START = 340;
/** Start heading: over the gate, with the clock tower ahead but left of the line. */
export const KURS_START = -0.16;
/** Footprint radius round a ring house's chimney that the sled can hit. */
export const HUS_R = 70;

/** Chimney top of a house standing at (x, z), or 0; houses block like Snøfall's buildings. */
export const husTopp = (hus: readonly FriHus[], x: number, z: number) => {
  let t = 0;
  for (const h of hus)
    if (
      Math.abs(h.x - x) < HUS_R * (h.sk ?? 1) &&
      Math.abs(h.z - z) < HUS_R * (h.sk ?? 1)
    )
      t = Math.max(t, h.h);
  return t;
};

/** Krystallgrotten at Nordtoppen's north-east foot (Hans, 2026-11-11). */
const GROTTE = { x: 4200, z: -18200 };
/**
 * The Bergen corridor runs out through the curtain behind the cave, on the
 * bearing from Snøfall over the cave (radians clockwise from north).
 */
export const BERGEN_KURS = Math.atan2(GROTTE.x, -GROTTE.z);
const KS = Math.sin(BERGEN_KURS);
const KC = Math.cos(BERGEN_KURS);
/** Sim point at `u` along the corridor's axis from Snøfall and `v` to its right. */
export const fraKorridor = (u: number, v: number): [number, number] => [
  u * KS + v * KC,
  -u * KC + v * KS,
];
/** A point in corridor coordinates: `u` along the axis, `v` across it. */
export const iKorridor = (x: number, z: number) => ({
  u: x * KS - z * KC,
  v: x * KC + z * KS,
});
const BERGEN_PORT = fraKorridor(GRENSE + 6000, 0);
/** Full stick turns this fast (a circle in about six seconds). */
const SVING = 1.05;
const KLATRE = 150;
/** How far ahead the sled reads the terrain; a wall higher than this over the sled is a crash. */
const SE_FRAM = 400;
const KLATRE_FRITT = 60;

export interface Sted {
  id: string;
  navn: string;
  /** Short label for the minimap. */
  kort: string;
  x: number;
  z: number;
  r: number;
  /** First December day the place is open; Bergen opens with day 24 solved (FriOpts.bergen). */
  dag: number;
  /** Rampenissen on the radio when the place is found; nordlandsk, no clues. */
  radio: string;
}

export const STEDER: readonly Sted[] = [
  {
    id: "snofall",
    navn: "SNØFALL",
    kort: "SNØFALL",
    x: 0,
    z: 0,
    r: 1800,
    dag: 8,
    radio: "Snøfall! Husan har piper, og pipan vil ha pakka.",
  },
  {
    id: "antenne",
    navn: "ANTENNA VED TJERNET",
    kort: "ANTENNA",
    x: -9500,
    z: -11000,
    r: 1300,
    dag: 8,
    radio: "Der e antenna! Ikkje fly inn i den, æ har prøvd.",
  },
  {
    id: "gaardene",
    navn: "GÅRDENE",
    kort: "GÅRDENE",
    x: 11500,
    z: 7500,
    r: 1600,
    dag: 8,
    radio: "Gårdan! Her bor dem som gir Trixter mat. Vink!",
  },
  {
    id: "nordtoppen",
    navn: "NORDTOPPEN",
    kort: "NORDTOPPEN",
    x: 1500,
    z: -16500,
    r: 2600,
    dag: 20,
    radio: "Nordtoppen! Høgare enn sleden rekk. Fly rundt, ikkje over.",
  },
  {
    id: "muren",
    navn: "MUREN",
    kort: "MUREN",
    // IQ's wall (day 21): an arc on the way from Snøfall to the cave, the gate on the axis (see MUR).
    x: Math.round(Math.sin(BERGEN_KURS) * 9000),
    z: Math.round(-Math.cos(BERGEN_KURS) * 9000),
    r: 2800,
    dag: 21,
    radio: "Muren. Én port e åpen, og den har varme i sæ. Sikt på gullet.",
  },
  {
    id: "grotten",
    navn: "KRYSTALLGROTTEN",
    kort: "GROTTEN",
    x: GROTTE.x,
    z: GROTTE.z,
    r: 1700,
    dag: 24,
    radio: "Grotta! Fly lavt over sprekken, så kjem lyset ned.",
  },
  {
    id: "bergen",
    navn: "BERGEN",
    kort: "BERGEN",
    // Reaches a little inside the curtain, so the closed gate bumps and says «ÅPNER JULAFTEN».
    x: BERGEN_PORT[0],
    z: BERGEN_PORT[1],
    r: 7000,
    dag: 24,
    radio:
      "Velkommen te Bergen! Her regne det, men i natt snør det for dokker.",
  },
];

export interface FriOpts {
  /** Today's date: places with a later day are locked. */
  dag: number;
  /** Day 24 solved: the gate in the curtain is open and Bergen lies beyond. */
  bergen: boolean;
  /** Day 22 solved: Bergen's last stop may be called by its name. */
  landås: boolean;
  reduceMotion?: boolean;
}

export const stedÅpent = (s: Sted, o: FriOpts) =>
  s.id === "bergen" ? o.bergen : o.dag >= s.dag;

/** The place's name for the day: its own when open, «ÅPNER DAG N» when locked; Landås only when day 22 is solved. */
export function stedsnavn(s: Sted, o: FriOpts, kort = false) {
  if (!stedÅpent(s, o)) return åpnerTekst(s.dag);
  if (s.id === "bergen" && o.landås) return "LANDÅS";
  return kort ? s.kort : s.navn;
}

interface Fjell {
  x: number;
  z: number;
  r: number;
  h: number;
}

const topp = (id: string) => STEDER.find((s) => s.id === id)!;

/** Round mountains: Nordtoppen too tall to cross at the summit, the cave's hill, and hills to fly over or around. */
export const FJELL: readonly Fjell[] = [
  { x: topp("nordtoppen").x, z: topp("nordtoppen").z, r: 1500, h: 600 },
  { x: topp("grotten").x, z: topp("grotten").z - 900, r: 1200, h: 170 },
  { x: -4000, z: -6000, r: 1100, h: 130 },
  { x: 6000, z: -3500, r: 900, h: 110 },
  { x: -9000, z: 9000, r: 1400, h: 160 },
  { x: 4000, z: 12000, r: 1000, h: 120 },
  { x: 16000, z: 0, r: 1300, h: 150 },
  { x: -16000, z: -8000, r: 1500, h: 180 },
  { x: 8000, z: -15000, r: 1000, h: 140 },
];

/**
 * IQ's wall: an arc of ridge round Snøfall at radius R, centred on the bearing
 * to the cave, too high to cross, with one warm gate on that bearing.
 */
export const MUR = {
  x: topp("muren").x,
  z: topp("muren").z,
  kurs: BERGEN_KURS,
  R: 9000,
  /** Half-length along the arc, in sim units. */
  halv: 3600,
  h: 520,
  /** Half-width of the gap in the ridge. */
  port: 420,
};

/** The point `s` sim units along the wall's arc from its gate (+ = clockwise, east). */
export const murPunkt = (s: number): [number, number] => {
  const a = MUR.kurs + s / MUR.R;
  return [Math.sin(a) * MUR.R, -Math.cos(a) * MUR.R];
};

/** Flat ground in Snøfall's tun and round the tarn, so streets and ice lie level. */
const FLATE = [
  { x: 0, z: 0, r: 1700 },
  { x: -10020, z: -11000, r: 600 },
] as const;

/** Ground height in altitude units (0.1 m) at a point on the vidda. */
export function høyde(x: number, z: number) {
  let flat = 1;
  for (const f of FLATE) {
    const d = Math.hypot(x - f.x, z - f.z) / f.r;
    if (d < 1.5) flat *= Math.max(0, Math.min(1, (d - 1) * 2));
  }
  let h =
    flat *
    (8 * Math.sin(x / 1900) * Math.sin(z / 2300) +
      5 * Math.sin(x / 700 + z / 900));
  for (const f of FJELL) {
    const dx = x - f.x;
    const dz = z - f.z;
    const d2 = (dx * dx + dz * dz) / (f.r * f.r);
    if (d2 < 7) h += f.h * Math.exp(-d2);
  }
  const fi = vinkelTil(MUR.kurs, peiling(0, 0, x, z));
  if (Math.abs(fi) < 1.2) {
    const s = fi * MUR.R;
    const mx = Math.max(0, Math.abs(s) - MUR.halv);
    const mz = Math.hypot(x, z) - MUR.R;
    const md2 = (mx * mx + mz * mz) / (350 * 350);
    if (md2 < 7) {
      const gap = s / MUR.port;
      h += MUR.h * Math.exp(-md2) * (1 - Math.exp(-gap * gap));
    }
  }
  return h;
}

/**
 * Snøfall: the round 300-year-old wall with the gate due south and four
 * onion-domed turrets, the clock tower in the middle of the tun, and the named
 * houses. Sim units; Hans 2026-11-11, layout from docs (`snofall-layout`).
 */
export const TUN = {
  r: 1500,
  /** Wall half-thickness, stone 60 plus palisade 30. */
  tykk: 12.5,
  h: 140,
  /** Gate opening half-width and height; the gatehouse is 300 wide, its gable 200. */
  port: 100,
  portH: 160,
  portHalv: 200,
  gavl: 300,
  tårnR: 70,
  tårnH: 300,
  /** Turrets on the wall at 45°, 135°, 225° and 315° (bearing). */
  tårn: [1, 3, 5, 7].map((i) => (i * Math.PI) / 4),
};

export interface Bygg {
  id: string;
  x: number;
  z: number;
  /** Footprint along x and z, and roof ridge height. */
  b: number;
  d: number;
  h: number;
}

/** Named buildings (spec positions; kafé and IQ's house are guesses from the text). */
export const BYGG: readonly Bygg[] = [
  { id: "klokketaarn", x: 0, z: 0, b: 80, d: 80, h: 480 },
  { id: "postkasse", x: 170, z: 70, b: 14, d: 14, h: 30 },
  { id: "pakkesentral", x: 530, z: 0, b: 340, d: 280, h: 220 },
  { id: "hovedhus", x: 0, z: -950, b: 460, d: 300, h: 340 },
  { id: "gront", x: -650, z: -400, b: 190, d: 160, h: 220 },
  { id: "kafe", x: 500, z: 540, b: 210, d: 170, h: 180 },
  { id: "iq", x: -950, z: 100, b: 190, d: 160, h: 240 },
  { id: "bod", x: -300, z: 110, b: 64, d: 48, h: 55 },
  { id: "bod", x: -300, z: 230, b: 64, d: 48, h: 55 },
  { id: "bod", x: -380, z: -60, b: 64, d: 48, h: 55 },
  { id: "bod", x: -200, z: 340, b: 64, d: 48, h: 55 },
  { id: "bod", x: 280, z: -260, b: 64, d: 48, h: 55 },
  { id: "bod", x: 250, z: 290, b: 64, d: 48, h: 55 },
];

/**
 * Top of whatever stands at (x, z) in Snøfall, in altitude units (0 = nothing).
 * The gate is open below its arch; above the arch the gable is in the way.
 */
export function bygg(x: number, z: number, alt: number) {
  const d = Math.hypot(x, z);
  if (d > TUN.r + 80) return 0;
  if (Math.abs(d - TUN.r) < 40 && z > 0 && Math.abs(x) < TUN.portHalv) {
    if (Math.abs(x) >= TUN.port) return TUN.gavl;
    return alt < TUN.portH - 5 ? 0 : TUN.gavl;
  }
  for (const a of TUN.tårn)
    if (
      Math.hypot(x - Math.sin(a) * TUN.r, z + Math.cos(a) * TUN.r) <
      TUN.tårnR + 10
    )
      return TUN.tårnH;
  if (Math.abs(d - TUN.r) < TUN.tykk + 8) return TUN.h;
  for (const b of BYGG)
    if (Math.abs(x - b.x) < b.b / 2 + 10 && Math.abs(z - b.z) < b.d / 2 + 10)
      return b.h;
  return 0;
}

/** Gust push at full strength, in sim units/s sideways (the sled flies FART). */
export const VIND_FRI = 140;

/** How hard the wind blows here, 0..1: calm on the plain, gusty near peaks and high up. */
export function vindStyrke(x: number, z: number, alt: number) {
  let fjell = 0;
  for (const f of FJELL) {
    const d2 = ((x - f.x) ** 2 + (z - f.z) ** 2) / (f.r * f.r);
    if (d2 < 16) fjell = Math.max(fjell, Math.exp(-d2 / 4));
  }
  return Math.min(1, 0.2 + fjell * 0.5 + (alt / ALT_MAX) * 0.35);
}

export interface FriHus {
  x: number;
  z: number;
  /** Chimney top in altitude units (one of HUS_PIPE). */
  h: number;
  rot: number;
  /** verden.meshes().hus index: 0–2 sizes, 3 ochre, 4 dark green. */
  variant: number;
  /** Mesh scale; Snøfall's houses are drawn twice the size of the farms'. */
  sk?: number;
  treff?: boolean;
  nær?: number;
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

/** Houses with chimneys: Snøfall's streets, the farms, and Bergen's rows past the gate. */
export function lagHus(bergen: boolean): FriHus[] {
  const r = rng(2026);
  const ut: FriHus[] = [];
  const sett = (x: number, z: number, rot: number) => {
    const variant = Math.floor(r() * 3);
    ut.push({ x, z, h: HUS_PIPE[variant], rot, variant });
  };
  // Snøfall: houses at twice the farms' size, packed in two rings along the ring
  // street and in rows along the main street, gables to the street; ochre to the
  // west, red to the north, dark green to the east. None on a street, by a named building or the gate.
  const SK = 2;
  const kandidater: [number, number, number][] = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    kandidater.push([Math.cos(a) * 1010, Math.sin(a) * 1010, Math.PI / 2 - a]);
  }
  for (let i = 0; i < 26; i++) {
    const a = ((i + 0.5) / 26) * Math.PI * 2;
    kandidater.push([Math.cos(a) * 1310, Math.sin(a) * 1310, Math.PI / 2 - a]);
  }
  for (const side of [-1, 1])
    for (const z of [470, 1040, 1280])
      kandidater.push([side * 220, z, (-side * Math.PI) / 2]);
  for (const [x, z, rot] of kandidater) {
    if (Math.abs(x) < 170 && z > 0) continue;
    if (Math.abs(Math.hypot(x, z) - 800) < 140) continue;
    if (
      BYGG.some(
        (b) =>
          Math.abs(x - b.x) < b.b / 2 + 130 &&
          Math.abs(z - b.z) < b.d / 2 + 130,
      )
    )
      continue;
    if (ut.some((h) => Math.hypot(h.x - x, h.z - z) < 250)) continue;
    const variant =
      x < -500 ? 3 : z < -700 ? 1 : x > 500 ? 4 : Math.floor(r() * 3);
    ut.push({ x, z, h: HUS_PIPE[variant % 3] * SK, rot, variant, sk: SK });
  }
  const g = topp("gaardene");
  for (let i = 0; i < 5; i++)
    sett(
      g.x + Math.cos(i * 1.26) * 650,
      g.z + Math.sin(i * 1.26) * 650,
      r() * Math.PI * 2,
    );
  if (bergen)
    for (let u = GRENSE + 4000; u < BERGEN_SLUTT - 1500; u += 420)
      for (const s of [-1, 1]) {
        const [x, z] = fraKorridor(u + r() * 120, s * (380 + r() * 160));
        sett(x, z, (s * Math.PI) / 2 + Math.PI - BERGEN_KURS);
      }
  return ut;
}

export interface Fugl {
  x: number;
  z: number;
  r: number;
  alt: number;
  /** Angular speed, radians per second. */
  w: number;
  fase: number;
}

/** Letter birds circling over the vidda; caught birds are back after a while. */
export const FUGLER: readonly Fugl[] = [
  { x: 1200, z: -2600, r: 700, alt: 140, w: 0.45, fase: 0 },
  { x: -3200, z: 1800, r: 900, alt: 190, w: -0.35, fase: 2 },
  { x: 5600, z: 3400, r: 800, alt: 120, w: 0.4, fase: 4 },
  { x: -7500, z: -7000, r: 1000, alt: 200, w: 0.3, fase: 1 },
  { x: 9000, z: -7000, r: 900, alt: 160, w: -0.4, fase: 3 },
  { x: 2500, z: 9000, r: 1100, alt: 230, w: 0.33, fase: 5 },
  { x: -11000, z: -2000, r: 800, alt: 130, w: -0.5, fase: 2.5 },
];
export const FUGL_TILBAKE = 25;

export const fuglPos = (f: Fugl, tid: number) => {
  const a = f.fase + f.w * tid;
  return {
    x: f.x + Math.cos(a) * f.r,
    z: f.z + Math.sin(a) * f.r,
    alt: f.alt + Math.sin(tid * 2 + f.fase) * 8,
    /** Heading of flight, so the mesh faces the way it goes. */
    kurs: Math.atan2(-Math.sin(a) * f.w, -Math.cos(a) * f.w),
  };
};

export interface FriPakke {
  x: number;
  z: number;
  alt: number;
  vx: number;
  vz: number;
  vy: number;
}

const G = 200;
function fall(p: FriPakke, dt: number) {
  p.vy -= G * dt;
  const drag = Math.max(0, 1 - 0.15 * dt);
  p.vx *= drag;
  p.vz *= drag;
  p.x += p.vx * dt;
  p.z += p.vz * dt;
  p.alt += p.vy * dt;
}

type Slipper = {
  x: number;
  z: number;
  alt: number;
  kurs: number;
  fart: number;
};
const nyPakke = (s: Slipper): FriPakke => ({
  x: s.x,
  z: s.z,
  alt: s.alt,
  vx: Math.sin(s.kurs) * s.fart,
  vz: -Math.cos(s.kurs) * s.fart,
  vy: 0,
});

/** Where a package dropped now would land: points every tenth of a second until the ground. */
export function forutsiFri(s: Slipper): FriPakke[] {
  const p = nyPakke(s);
  const ut: FriPakke[] = [];
  for (let i = 0; i < 40 && p.alt > høyde(p.x, p.z); i++) {
    fall(p, 0.1);
    ut.push({ ...p });
  }
  return ut;
}

/** Bearing from (x, z) to a point, radians clockwise from north. */
export const peiling = (x: number, z: number, tx: number, tz: number) =>
  Math.atan2(tx - x, -(tz - z));

/** Shortest signed turn from kurs a to b, in (-π, π]. */
export const vinkelTil = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
};

/** «1,2 KM» from a distance in sim units. */
export const kmTekst = (d: number) =>
  `${(d / 10000).toFixed(1).replace(".", ",")} KM`;

/**
 * How far outside the flyable vidda a point is (0 inside), and the point to
 * turn back towards. With Bergen open the corridor south through the gate counts too.
 */
export function utenfor(x: number, z: number, bergen: boolean) {
  const ut = Math.hypot(x, z) - GRENSE;
  let ute = ut;
  let mål: [number, number] = [0, 0];
  const { u, v } = iKorridor(x, z);
  if (bergen && u > 0) {
    const k = Math.max(Math.abs(v) - PORT_BREDDE, u - BERGEN_SLUTT);
    if (k < ute) {
      ute = k;
      mål = fraKorridor(Math.min(u, BERGEN_SLUTT - 3000), 0);
    }
  }
  return { ute: Math.max(0, ute), mål };
}

export type FriHendelse =
  | "fugl"
  | "krasj"
  | "skrape"
  | "oppdaget"
  | "låst"
  | "snu"
  | "bergen"
  | "grotte"
  | "slipp"
  | "levering"
  | "nærLevering"
  | "pakkebom";

export function createFri(o: FriOpts) {
  const hus = lagHus(o.bergen);
  const grotte = topp("grotten");
  const s = {
    // South of the gate, high over it, the tower ahead but off the line.
    x: 0,
    z: 2600,
    alt: ALT_START,
    /** Heading, radians clockwise from north (-z). */
    kurs: KURS_START,
    /** Smoothed stick, drives the turn and the bank. */
    sving: 0,
    /** The stick as the reins feel it (first lag stage), and the sleigh's trailing turn. */
    styr: 0,
    aero: 1,
    /** Sideways wind on the sled, -1..1 (+ = from the left); the snow drifts with it. */
    vind: 0,
    slep: 0,
    bank: 0,
    fart: 0,
    tid: 0,
    poeng: 0,
    pakker: 0,
    pakkebom: 0,
    fugler: 0,
    slipp: 0,
    pakke: null as FriPakke | null,
    sisteMeter: 0,
    sisteHus: null as FriHus | null,
    sakteTil: 0,
    /** After a crash the sled stands still until this time, then flies on slowly. */
    stoppTil: 0,
    /** After a crash a held dive is ignored until the stick comes back up. */
    dykkSperre: false,
    /** Sled damage 0–1 from scrapes; 1 is a crash, a respawn starts it over. */
    skade: 0,
    sisteSkade: -Infinity,
    låstTil: 0,
    /** Places found so far, and the last one found or bumped (its name for the HUD). */
    oppdaget: new Set<string>(),
    sisteSted: "",
    ute: false,
    iBergen: false,
    grotteLyst: false,
    /** When each bird was caught; back FUGL_TILBAKE seconds later. */
    fanget: FUGLER.map(() => -Infinity),
    hus,
  };
  const motion = o.reduceMotion ? 0.72 : 1;

  // A crash stops the sled briefly, then sets it down a stretch back and a bit
  // higher; after hitting something ahead it faces away, so it does not fly
  // straight back in.
  function krasj(ev: FriHendelse[], fx: number, fz: number, snu: boolean) {
    s.stoppTil = s.tid + 0.6;
    s.sakteTil = s.tid + 1.8;
    s.dykkSperre = true;
    s.x -= fx * 600;
    s.z -= fz * 600;
    if (snu) s.kurs += Math.PI;
    s.alt = Math.min(ALT_MAX, Math.max(s.alt, høyde(s.x, s.z) + 30) + 60);
    s.skade = 0;
    ev.push("krasj");
  }

  function step(dt: number, inn: Styring): FriHendelse[] {
    const ev: FriHendelse[] = [];
    // A stalled tab or a zero step must not blow up the sim.
    dt = Math.min(0.1, Math.max(0, dt || 0));
    s.tid += dt;
    // Two lag stages: the turn eases in and out over STYRE_TREGHET, and is slower at speed.
    const k = Math.min(1, (dt * 4) / STYRE_TREGHET);
    s.styr += (Math.max(-1, Math.min(1, inn.steer)) - s.styr) * k;
    s.sving += (s.styr - s.sving) * k;
    s.slep += (s.sving - s.slep) * Math.min(1, dt * 2.5);
    const fartsforhold = s.fart > 0 ? s.fart / FART : 1;
    let sving = s.sving * SVING * Math.min(1.1, 1 / Math.sqrt(fartsforhold));

    // Past the curtain the sled is turned back; far past it, carried back.
    const { ute, mål } = utenfor(s.x, s.z, o.bergen);
    if (ute > 0) {
      const mot = vinkelTil(s.kurs, peiling(s.x, s.z, mål[0], mål[1]));
      sving += Math.sign(mot) * Math.min(1, ute / 1500) * 1.4;
      if (!s.ute) ev.push("snu");
      s.ute = true;
      if (ute > 4000) {
        const f = Math.min(1, ((ute - 4000) / (ute + GRENSE)) * dt * 9);
        s.x += (mål[0] - s.x) * f;
        s.z += (mål[1] - s.z) * f;
      }
    } else s.ute = false;

    s.kurs += sving * dt;
    s.bank += (s.sving * 0.55 - s.bank) * Math.min(1, dt * 5);

    const gass = Math.max(-1, Math.min(1, inn.gass ?? 0));
    let mult = gass > 0 ? 1 + 0.25 * gass : 1 + 0.35 * gass;
    if (s.tid < s.sakteTil) mult *= 0.45;
    s.aero += (1 - AERO * inn.climb - s.aero) * Math.min(1, dt * 1.2);
    mult *= s.aero;
    s.fart = FART * mult * motion;
    if (s.tid >= s.sakteTil && inn.climb > 0 && s.fart < FART * motion * 0.7)
      s.alt -= 60 * dt;
    const fx = Math.sin(s.kurs);
    const fz = -Math.cos(s.kurs);

    // Terrain: a gentle rise ahead lifts the nose; a wall, or ground above the ceiling, is a crash.
    // Snøfall's wall, gate and houses are read close ahead; the top of one is a hard edge.
    let fram = høyde(s.x + fx * SE_FRAM, s.z + fz * SE_FRAM) + 40;
    for (const k of [60, 100, 150])
      fram = Math.max(
        fram,
        bygg(s.x + fx * k, s.z + fz * k, s.alt) + 60,
        husTopp(hus, s.x + fx * k, s.z + fz * k) + 60,
      );
    if (fram > ALT_MAX || fram > s.alt + KLATRE_FRITT) {
      if (s.tid >= s.sakteTil) krasj(ev, fx, fz, true);
    } else if (s.tid < s.stoppTil) {
      // Just crashed: the sled sits still in the snow for a moment.
    } else {
      s.x += fx * s.fart * dt;
      s.z += fz * s.fart * dt;
      // A steep rise drags the runners along the slope: a scrape.
      if (fram > s.alt + 25 && s.tid - s.sisteSkade > 0.6) {
        s.sisteSkade = s.tid;
        s.skade += SKADE_PER_TREFF;
        if (s.skade >= 1) krasj(ev, fx, fz, true);
        else ev.push("skrape");
      }
      if (fram > s.alt) s.alt += (fram - s.alt) * Math.min(1, dt * 4);
    }
    if (inn.climb >= 0) s.dykkSperre = false;
    const forrigeAlt = s.alt;
    if (!(inn.climb < 0 && s.dykkSperre)) s.alt += inn.climb * KLATRE * dt;
    // Diving into the ground is a crash too, counted on arrival only.
    const gulv = Math.max(ALT_MIN, høyde(s.x, s.z) + 30);
    if (
      inn.climb < 0 &&
      s.alt <= gulv &&
      forrigeAlt > gulv &&
      s.tid >= s.sakteTil
    )
      krasj(ev, fx, fz, false);
    s.alt = Math.max(ALT_MIN, høyde(s.x, s.z) + 30, Math.min(ALT_MAX, s.alt));

    // Wind: like the stages' gust zones it eases in, but here it never stops,
    // turning slowly, and blows hardest by the peaks and high up.
    const retning =
      Math.sin(s.tid * 0.31) * 0.7 + Math.sin(s.tid * 0.11 + 2) * 0.5;
    const vindMål =
      Math.max(-1, Math.min(1, retning)) * vindStyrke(s.x, s.z, s.alt);
    s.vind += (vindMål - s.vind) * Math.min(1, dt * 1.5);
    if (s.tid >= s.stoppTil) {
      s.x += Math.cos(s.kurs) * s.vind * VIND_FRI * motion * dt;
      s.z += Math.sin(s.kurs) * s.vind * VIND_FRI * motion * dt;
    }

    // Places: a locked one is a soft wall, an open one is found once.
    for (const st of STEDER) {
      const dx = s.x - st.x;
      const dz = s.z - st.z;
      const d = Math.hypot(dx, dz);
      if (d >= st.r) continue;
      if (!stedÅpent(st, o)) {
        const ut = st.r + 1;
        s.x = st.x + (dx / (d || 1)) * ut;
        s.z = st.z + (dz / (d || 1)) * ut;
        // Turn away from the place so the sled does not grind along it.
        const bort = vinkelTil(s.kurs, peiling(st.x, st.z, s.x, s.z));
        s.kurs += Math.sign(bort || 1) * 1.6 * dt;
        if (s.tid >= s.låstTil) {
          s.låstTil = s.tid + 2;
          s.sisteSted = åpnerTekst(st.dag);
          ev.push("låst");
        }
      } else if (!s.oppdaget.has(st.id)) {
        s.oppdaget.add(st.id);
        s.sisteSted = stedsnavn(st, o);
        ev.push("oppdaget");
      }
    }
    if (o.bergen) {
      const { u, v } = iKorridor(s.x, s.z);
      if (!s.iBergen && u > GRENSE && Math.abs(v) < PORT_BREDDE) {
        s.iBergen = true;
        ev.push("bergen");
      } else if (u < GRENSE - 800) s.iBergen = false;
    }

    // The cave: light dropped by flying low over the crack in front of its hill (once).
    if (
      !s.grotteLyst &&
      o.dag >= grotte.dag &&
      s.alt < 110 &&
      Math.hypot(s.x - grotte.x, s.z - grotte.z) < 500
    ) {
      s.grotteLyst = true;
      s.poeng += 150;
      ev.push("grotte");
    }

    // Letter birds fly into the sack.
    for (let i = 0; i < FUGLER.length; i++) {
      if (s.tid - s.fanget[i] < FUGL_TILBAKE) continue;
      const f = fuglPos(FUGLER[i], s.tid);
      if (
        Math.hypot(f.x - s.x, f.z - s.z) < 90 &&
        Math.abs(f.alt - s.alt) < 45
      ) {
        s.fanget[i] = s.tid;
        s.fugler++;
        s.poeng += 80;
        ev.push("fugl");
      }
    }

    if (inn.slipp && !s.pakke) {
      s.pakke = nyPakke(s);
      s.slipp++;
      ev.push("slipp");
    }
    if (s.pakke) {
      const p = s.pakke;
      fall(p, dt);
      const mål = hus.find(
        (h) =>
          !h.treff &&
          Math.abs(h.x - p.x) < 120 &&
          Math.abs(h.z - p.z) < 120 &&
          p.alt <= h.h &&
          p.alt > h.h - 45,
      );
      if (mål) {
        mål.treff = true;
        s.pakker++;
        s.poeng += PIPE_POENG - (mål.nær ?? 0);
        mål.nær = PIPE_POENG;
        s.sisteMeter = 0;
        s.pakke = null;
        ev.push("levering");
      } else if (p.alt <= høyde(p.x, p.z)) {
        let nærmest: FriHus | null = null;
        let m = NÆR_M;
        s.sisteHus = null;
        let nærD = 1500;
        for (const h of hus) {
          const d = Math.hypot(h.x - p.x, h.z - p.z);
          if (d / 10 < m) {
            m = d / 10;
            nærmest = h;
          }
          if (d < nærD) {
            nærD = d;
            s.sisteHus = h;
          }
        }
        const poeng = nærPoeng(m);
        if (nærmest && poeng > 0) {
          if (poeng > (nærmest.nær ?? 0)) {
            s.poeng += poeng - (nærmest.nær ?? 0);
            nærmest.nær = poeng;
          }
          s.sisteMeter = Math.max(0.1, m);
          ev.push("nærLevering");
        } else {
          s.pakkebom++;
          ev.push("pakkebom");
        }
        s.pakke = null;
      }
    }
    return ev;
  }

  return { s, step };
}

export type FriSim = ReturnType<typeof createFri>;

/** The nearest open place that is not where the sled already is, as «NORDTOPPEN 1,2 KM». */
export function nærmesteSted(s: { x: number; z: number }, o: FriOpts) {
  let best: Sted | null = null;
  let bd = Infinity;
  for (const st of STEDER) {
    if (!stedÅpent(st, o)) continue;
    const d = Math.hypot(st.x - s.x, st.z - s.z) - st.r;
    if (d > 0 && d < bd) {
      bd = d;
      best = st;
    }
  }
  return best ? `${stedsnavn(best, o)} ${kmTekst(bd)}` : "";
}

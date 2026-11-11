/**
 * IQs sledesimulator: stages, course generation, daily challenges and the pure simulation.
 * No DOM here, so stage gating, scoring and the assist rules are testable.
 * The player moves in x (track units, 0 = centre) and altitude; the world
 * rolls towards the camera in z. Collisions are checked when a thing crosses z = 0.
 * «varde» in the code is the golden ring the sled flies through (RINGER in the HUD);
 * the name stays because saved results and stage ids use it.
 */

export type EtappeId =
  | "tundra"
  | "vardeloypa"
  | "granskogen"
  | "stjernedrysset"
  | "kastevind"
  | "tindeflukten"
  | "nordtoppen"
  | "muren"
  | "julenatt";

/** What a course is made of; lagBane draws one thing per segment from these odds. */
export interface Blanding {
  /** Every n-th segment is a ring. */
  varde: number;
  /** How far the rings swing above and below cruise altitude, in altitude units. */
  høyde: number;
  /** Odds per free segment. */
  tre: number;
  stjerne: number;
  /** Letter birds to catch in the air; odds per free segment. */
  fugl: number;
  topp: number;
  vind: number;
  /** Gust strength relative to the first stages. */
  vindKraft: number;
  /** Every n-th segment is an aurora band (0 = none). */
  band: number;
  /** Every n-th segment is a house with a smoking chimney to deliver to (0 = none). */
  hus?: number;
  /** Odds that a tree stands on the ring line halfway between two rings (over it or round it). */
  sti?: number;
  /** Odds of a cliff (a peak) on the ring line in the same slot; climb over or go round. */
  klippe?: number;
  grotte?: boolean;
  mur?: boolean;
}

export interface SledeEtappe {
  id: EtappeId;
  /** First December day the stage can be flown. Story stages keep 20, 21 and 24. */
  dag: number;
  navn: string;
  /** One line from IQ on the start screen. */
  intro: string;
  /** Course length in world units; ~900 units/s. */
  lengde: number;
  fart: number;
  blanding: Blanding;
  /** Painted horizon in MEDIA_DIR (feed/slede-*.jpg), with its horizon line as a fraction of image height. */
  horisont: { fil: string; linje: number };
  himmel: [string, string];
  snø: [string, string];
  /** Far-ground haze the snow fades into, matched to the painting's horizon. */
  dis: string;
  nordlys: number;
  tåke: boolean;
  snøfall: number;
}

const TUNDRA = { fil: "feed/slede-tundra.jpg", linje: 0.69 };
const NORDTOPPEN = { fil: "feed/slede-nordtoppen.jpg", linje: 0.735 };
const MUREN = { fil: "feed/slede-muren.jpg", linje: 0.69 };
const JULENATT = { fil: "feed/slede-julenatt.jpg", linje: 0.72 };

const ROLIG: Blanding = {
  varde: 3,
  høyde: 45,
  tre: 0.25,
  stjerne: 0.3,
  fugl: 0.05,
  topp: 0,
  vind: 0.15,
  vindKraft: 1,
  band: 0,
};

/**
 * A new stage every few days from 8 December (8, 9, 12, 14, 18, 19, then the
 * story days 20, 21, 24); each turns one knob further (ring density, trees,
 * stars, wind, peaks) before the story stages.
 * Names and intros are visible from the stage's day: no day codes (kodelekkasje.test.ts).
 */
export const ETAPPER: readonly SledeEtappe[] = [
  {
    id: "tundra",
    dag: 8,
    navn: "Tundra-testen",
    intro:
      "Nyoverhalt slede. Fly gjennom de gylne ringene, så ser vi om tømmene holder!",
    lengde: 30000,
    fart: 800,
    blanding: ROLIG,
    horisont: TUNDRA,
    himmel: ["#050816", "#141c3a"],
    snø: ["#d2e1f5", "#b9cdeb"],
    dis: "#93a6c6",
    nordlys: 0.25,
    tåke: false,
    snøfall: 40,
  },
  {
    id: "vardeloypa",
    dag: 9,
    navn: "Ringløypa",
    intro:
      "Ringene henger tett i kveld, høyt og lavt. Treff midt i ringen, så ringer bjella høyest.",
    lengde: 34000,
    fart: 850,
    blanding: { ...ROLIG, varde: 2, høyde: 55, tre: 0.2, stjerne: 0.2 },
    horisont: TUNDRA,
    himmel: ["#070a1c", "#1a2448"],
    snø: ["#dbe7f7", "#c3d4ee"],
    dis: "#9fb0cc",
    nordlys: 0.4,
    tåke: false,
    snøfall: 25,
  },
  {
    id: "granskogen",
    dag: 12,
    navn: "Granskogen",
    intro:
      "Skogen står tett som en børste. Lavt mellom stammene, eller høyt over toppene!",
    lengde: 38000,
    fart: 880,
    blanding: {
      ...ROLIG,
      sti: 0.2,
      fugl: 0.06,
      høyde: 65,
      tre: 0.6,
      stjerne: 0.15,
      vind: 0.05,
    },
    horisont: TUNDRA,
    himmel: ["#04070f", "#0f1a2c"],
    snø: ["#c8d8ea", "#adc1dc"],
    dis: "#7f93b0",
    nordlys: 0.1,
    tåke: false,
    snøfall: 60,
  },
  {
    id: "stjernedrysset",
    dag: 14,
    navn: "Stjernedrysset",
    intro:
      "Det drysser stjerner over vidda. Opp og ned, opp og ned, plukk alt som glitrer!",
    lengde: 40000,
    fart: 900,
    blanding: {
      ...ROLIG,
      sti: 0.15,
      fugl: 0.07,
      høyde: 75,
      tre: 0.2,
      stjerne: 0.55,
      vind: 0.05,
      hus: 10,
    },
    horisont: JULENATT,
    himmel: ["#02040c", "#0b1430"],
    snø: ["#d9e4f5", "#c0d2ec"],
    dis: "#8ea4c8",
    nordlys: 0.15,
    tåke: false,
    snøfall: 10,
  },
  {
    id: "kastevind",
    dag: 18,
    navn: "Kastevind-dalen",
    intro:
      "Vinden kaster fra begge sider i dalen. Len deg mot kastet, ikke med det!",
    lengde: 42000,
    fart: 920,
    blanding: {
      ...ROLIG,
      sti: 0.2,
      klippe: 0.1,
      fugl: 0.08,
      høyde: 60,
      tre: 0.3,
      stjerne: 0.2,
      vind: 0.4,
      vindKraft: 1.6,
      hus: 10,
    },
    horisont: TUNDRA,
    himmel: ["#0d1322", "#263046"],
    snø: ["#c9d2df", "#b1bccd"],
    dis: "#aab4c6",
    nordlys: 0,
    tåke: false,
    snøfall: 90,
  },
  {
    id: "tindeflukten",
    dag: 19,
    navn: "Tindeflukten",
    intro:
      "Tindene stikker opp som tenner. Opp i god tid, Rudolf liker ikke stein i pelsen.",
    lengde: 46000,
    fart: 950,
    blanding: {
      ...ROLIG,
      sti: 0.15,
      klippe: 0.3,
      fugl: 0.08,
      høyde: 80,
      tre: 0.1,
      stjerne: 0.25,
      topp: 0.35,
      vind: 0.1,
      hus: 11,
    },
    horisont: NORDTOPPEN,
    himmel: ["#03060f", "#0e1a30"],
    snø: ["#c9dff0", "#aac6e4"],
    dis: "#a3b7cf",
    nordlys: 0.5,
    tåke: false,
    snøfall: 35,
  },
  {
    id: "nordtoppen",
    dag: 20,
    navn: "Nordlys-strømmen",
    intro: "Himmelen knitrer! Fly inn i lysbåndene, de gir løft over tindene.",
    lengde: 60000,
    fart: 1000,
    blanding: {
      ...ROLIG,
      sti: 0.2,
      klippe: 0.3,
      fugl: 0.1,
      høyde: 80,
      tre: 0.15,
      stjerne: 0.25,
      topp: 0.35,
      vind: 0.1,
      band: 9,
      hus: 12,
    },
    horisont: NORDTOPPEN,
    himmel: ["#03060f", "#0e1a30"],
    snø: ["#c9dff0", "#aac6e4"],
    dis: "#a3b7cf",
    nordlys: 1,
    tåke: false,
    snøfall: 30,
  },
  {
    id: "muren",
    dag: 21,
    navn: "Muren og porten",
    intro:
      "Tett føyke. Muren har én åpen port med varme i. Se etter det gylne skjæret.",
    lengde: 54000,
    fart: 950,
    blanding: {
      ...ROLIG,
      sti: 0.3,
      fugl: 0.06,
      høyde: 50,
      tre: 1,
      stjerne: 0,
      vind: 0,
      mur: true,
      hus: 13,
    },
    horisont: MUREN,
    himmel: ["#1a2030", "#3a4458"],
    snø: ["#c3ccd8", "#aab4c3"],
    dis: "#b9c3d1",
    nordlys: 0,
    tåke: true,
    snøfall: 110,
  },
  {
    id: "julenatt",
    dag: 24,
    navn: "Julenatt over grotten",
    intro:
      "Stjerneklart. Fly lavt over grotten så lyset når ned, så setter vi kursen mot Landås.",
    lengde: 70000,
    fart: 1000,
    blanding: {
      ...ROLIG,
      sti: 0.25,
      klippe: 0.2,
      fugl: 0.1,
      høyde: 85,
      tre: 0.3,
      stjerne: 0.3,
      vind: 0.2,
      vindKraft: 1.3,
      grotte: true,
      hus: 9,
    },
    horisont: JULENATT,
    himmel: ["#02040c", "#0b1430"],
    snø: ["#d9e4f5", "#c0d2ec"],
    dis: "#8ea4c8",
    nordlys: 0.15,
    tåke: false,
    snøfall: 20,
  },
];

export const etapperFor = (day: number) => ETAPPER.filter((e) => day >= e.dag);

/** «ÅPNER DAG 21»; day 24 is spelled out because its number is also a code. */
export const åpnerTekst = (dag: number) =>
  dag === 24 ? "ÅPNER JULAFTEN" : `ÅPNER DAG ${dag}`;

/** The two pilots with their own high scores (Hanna, 5, flies on a brother's name). */
export const SPILLERE = ["Kristian", "Håkon"] as const;

export type TingType =
  | "varde"
  | "tre"
  | "topp"
  | "vind"
  | "band"
  | "stjerne"
  | "mur"
  | "grotte"
  | "hus"
  | "fugl";

export interface Ting {
  z: number;
  x: number;
  type: TingType;
  /** Height for obstacles, centre altitude for rings and stars, chimney top for houses. */
  h: number;
  /** Wind: force sign and length in z. Gate (mur): the open gate's x. */
  kraft?: number;
  lengde?: number;
  port?: number;
  /** Set once the thing has been passed (hit or missed). */
  ferdig?: boolean;
  treff?: boolean;
  /** Houses: best delivery points so far (before the run multiplier); only an improvement pays. */
  nær?: number;
  /** Teasers of a later stage: the day it opens; låst is set by createSim from SimOpts.dag. */
  lås?: number;
  låst?: boolean;
}

// Deterministic per stage so a course is the same for every kid and every test.
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

const SEG = 220;
/** Chimney top per house size, in altitude units (verden.ts builds the matching mesh). */
export const HUS_PIPE: readonly number[] = [105, 125, 145];
/** The sleigh is clamped to ±1.3, so nothing is placed where it cannot be reached. */
const X_MAX = 1.25;
/** Rings hang between these altitudes, a margin inside what the sled can fly. */
const RING_ALT_MIN = 110;
const RING_ALT_MAX = 400;
/**
 * Half-axes of a ring's opening: track units sideways, altitude units up and down.
 * Rounder in the world (9.9 × 6 render units) than the old wide oval, so it reads as a hoop
 * standing up across the course, not one lying flat.
 */
export const RING_X = 0.22;
export const RING_ALT = 60;
/** Climb rate in altitude units per second (step), used to keep ring steps reachable. */
export const KLATRE = 190;

/** 0 at the ring's centre, 1 on its rim, more outside; the ring is an ellipse in sim units. */
export const ringAvvik = (px: number, alt: number, t: Ting) =>
  Math.hypot((px - t.x) / RING_X, (alt - t.h) / RING_ALT);

export function lagBane(e: SledeEtappe): Ting[] {
  const out = lagLøype(e);
  // A teaser of the next stage: its peak stands locked beside the finish, out of
  // the sled's reach (|x| > 1.75), until that stage's day.
  const neste = ETAPPER[ETAPPER.indexOf(e) + 1];
  if (neste)
    for (const [dz, x] of [
      [-2200, 1.9],
      [-1600, -2.1],
    ] as const)
      out.push({ z: e.lengde + dz, x, type: "topp", h: 230, lås: neste.dag });
  return out.sort((a, b) => a.z - b.z);
}

function lagLøype(e: SledeEtappe): Ting[] {
  let seed = e.lengde;
  for (const c of e.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  const hinder = rng(seed ^ 0x5bd1e995);
  const m = e.blanding;
  const out: Ting[] = [];
  const slutt = e.lengde - 2500;
  let lane = 0;
  // Consecutive rings step up or down by most of the stage's height, so
  // the player has to climb and dive between every pair, never just steer. No
  // step is more than the sled can climb between two rings at the stage's speed.
  let alt = ALT_CRUISE;
  const steg = ((KLATRE * m.varde * SEG) / e.fart) * 0.7;
  const minSteg = Math.min(
    steg,
    Math.max(RING_ALT + 4, Math.min(steg * 0.6, m.høyde * 0.9)),
  );
  const lav = Math.max(RING_ALT_MIN, ALT_CRUISE - m.høyde);
  const høy = Math.min(RING_ALT_MAX, ALT_CRUISE + m.høyde);
  let ring = 0;
  for (let z = 1500, i = 0; z < slutt; z += SEG, i++) {
    const u = r();
    // Rings weave left and right so the course is a slalom, never a straight line.
    if (i % m.varde === 0) {
      lane = Math.max(-0.7, Math.min(0.7, lane + (r() - 0.5) * 0.9));
      // The last stretch is a spike: the full climb the stage allows.
      const d =
        z > slutt - 3500
          ? steg
          : minSteg + r() * (Math.min(steg, m.høyde * 1.6) - minSteg);
      let opp = r() < 0.5;
      // Turn back when the band runs out, so the step is never clamped away.
      // the band is at least 90 tall, so the roomier side always fits a real step.
      if (opp ? alt + d > høy : alt - d < lav) opp = høy - alt > alt - lav;
      alt += opp ? d : -d;
      alt = Math.max(lav, Math.min(høy, alt));
      // Teaching rings on the first stage: one low, one high, both dead ahead.
      if (e.dag === 8 && ring < 2) {
        alt = ring ? Math.min(høy, lav + steg * 0.9) : lav;
        lane = 0;
      }
      ring++;
      out.push({ z, x: lane, type: "varde", h: Math.round(alt) });
      continue;
    }
    if (m.grotte && i % 23 === 11) {
      out.push({ z, x: 0, type: "grotte", h: 0, lengde: 1600 });
      z += 1600;
      continue;
    }
    if (m.band && i % m.band === 4) {
      out.push({ z, x: lane * 0.5, type: "band", h: 200 });
      continue;
    }
    // Houses stand beside the ring line, within reach; h is the chimney top (three sizes).
    if (m.hus && i % m.hus === 5) {
      const side = r() < 0.5 ? -1 : 1;
      out.push({
        z,
        x: Math.max(-1, Math.min(1, lane + side * 0.8)),
        type: "hus",
        h: HUS_PIPE[i % 3],
      });
      continue;
    }
    // Obstacles in the path ramp up by stage: halfway between rings there is
    // time to read them, go over or round, and line up for the next ring.
    if (m.varde >= 3 && i % m.varde === 1 && (m.sti || m.klippe)) {
      // Own draw, so the odds of birds and stars in the other slots stay put.
      const v = hinder();
      if (v < (m.sti ?? 0)) {
        out.push({ z, x: lane, type: "tre", h: 160 });
        continue;
      }
      if (v < (m.sti ?? 0) + (m.klippe ?? 0)) {
        out.push({ z, x: lane, type: "topp", h: 230 });
        continue;
      }
    }
    let p = m.topp;
    if (u < p) {
      out.push({ z, x: (r() - 0.5) * 1.6, type: "topp", h: 230 });
      continue;
    }
    if (u < (p += m.fugl)) {
      out.push({
        z,
        x: Math.max(-1, Math.min(1, lane + (r() - 0.5))),
        type: "fugl",
        h: 100 + r() * 110,
      });
      continue;
    }
    if (u < (p += m.stjerne)) {
      out.push({
        z,
        x: lane + (r() - 0.5) * 1.2,
        type: "stjerne",
        h: 70 + r() * 160,
      });
      continue;
    }
    if (u < (p += m.tre)) {
      const side = r() < 0.5 ? -1 : 1;
      const x = lane + side * (0.55 + r() * 0.9);
      out.push({
        z,
        x: Math.max(-X_MAX, Math.min(X_MAX, x)),
        type: "tre",
        h: 160,
      });
      continue;
    }
    if (u < p + m.vind) {
      out.push({
        z,
        x: 0,
        type: "vind",
        h: 0,
        kraft: r() < 0.5 ? -1 : 1,
        lengde: 1800,
      });
    }
  }
  if (m.mur) {
    for (const [f, port] of [
      [0.4, -0.5],
      [0.72, 0.55],
      [0.97, 0],
    ]) {
      const z = Math.round(e.lengde * f);
      // Clear the approach so the gate is the only thing to read in the fog.
      for (const t of out) if (Math.abs(t.z - z) < 1500) t.ferdig = true;
      out.push({ z, x: 0, type: "mur", h: 200, port });
    }
  }
  return out.filter((t) => !t.ferdig).sort((a, b) => a.z - b.z);
}

export type UtfordringType =
  "varder" | "renflyging" | "stjerner" | "tid" | "rekke" | "nære";

export interface Utfordring {
  type: UtfordringType;
  mål: number;
  tekst: string;
  bonus: number;
}

const UTFORDRINGER: readonly UtfordringType[] = [
  "varder",
  "renflyging",
  "stjerner",
  "tid",
  "rekke",
  "nære",
];
export const UTFORDRING_BONUS = 500;

// The numeric day codes are plain numbers; a target that spells one would
// trip kodelekkasje, so those two counts are nudged by one.
const trygtTall = (n: number) => (n === 24 || n === 75 ? n + 1 : n);

/**
 * The day's challenge: one of six, cycling with the date so every open day
 * asks for something new, with the target scaled to the chosen stage.
 */
export function dagensUtfordring(day: number, e: SledeEtappe): Utfordring {
  const bane = lagBane(e);
  const antall = (type: TingType) => bane.filter((t) => t.type === type).length;
  let type = UTFORDRINGER[day % UTFORDRINGER.length];
  if (type === "stjerner" && !antall("stjerne")) type = "nære";
  const bonus = UTFORDRING_BONUS;
  switch (type) {
    case "varder": {
      const mål = trygtTall(Math.ceil(antall("varde") * 0.6));
      return { type, mål, tekst: `Fly gjennom minst ${mål} ringer`, bonus };
    }
    case "renflyging":
      return { type, mål: 0, tekst: "Fly hele veien uten krasj", bonus };
    case "stjerner": {
      const mål = trygtTall(Math.ceil(antall("stjerne") * 0.5));
      return { type, mål, tekst: `Plukk ${mål} stjerner`, bonus };
    }
    case "tid": {
      const mål = Math.ceil(((e.lengde / e.fart) * 1.15) / 10) * 10;
      return { type, mål, tekst: `I mål på under ${mål} sekunder`, bonus };
    }
    case "rekke":
      return { type, mål: 6, tekst: "Seks ringer på rad", bonus };
    case "nære":
      return {
        type,
        mål: 3,
        tekst: "Skli tett forbi tre trær eller tinder",
        bonus,
      };
  }
}

export interface Leveringsoppdrag {
  mål: number;
  tekst: string;
  bonus: number;
}

export const LEVERING_BONUS = 300;

/** The day's delivery mission on stages with houses: half to most of the chimneys, varying with the date. */
export function leveringsoppdrag(
  day: number,
  e: SledeEtappe,
): Leveringsoppdrag | null {
  const hus = lagBane(e).filter((t) => t.type === "hus").length;
  if (!hus) return null;
  const mål = trygtTall(Math.max(1, Math.ceil(hus * [0.4, 0.5, 0.6][day % 3])));
  return {
    mål,
    tekst: `Lever ${mål} ${mål === 1 ? "pakke" : "pakker"} ned pipa`,
    bonus: LEVERING_BONUS,
  };
}

const GENERISKE_PAKKER = [
  "PAKKE FRA HJERTERUD",
  "PAKKE FRA IQ",
  "PAKKE FRA JULIUS",
  "PAKKE FRA RAMPENISSEN",
];

/** Name of the n-th package: the kids' own letters first, then the generic sacks. */
export function pakkenavn(brev: { from?: string }[], n: number) {
  const navn = [
    ...new Set(brev.map((b) => b.from?.trim()).filter((f): f is string => !!f)),
  ].map((f) => `PAKKE TIL ${f.toUpperCase()}`);
  const alle = navn.length ? navn : GENERISKE_PAKKER;
  return alle[n % alle.length];
}

export interface Pakke {
  x: number;
  alt: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

/** Metres per track unit sideways and per sim unit along the course (verden.ts SPOR and SKALA). */
const M_X = 45;
const M_Z = 0.1;
/** Full delivery points; they fall linearly to 0 at NÆR_M metres from the chimney. */
export const PIPE_POENG = 200;
export const NÆR_M = 30;

/** Ground distance in metres from a landed package to a house's chimney. */
export const meterFraPipa = (p: { x: number; z: number }, t: Ting) =>
  Math.hypot((p.x - t.x) * M_X, (p.z - t.z) * M_Z);

/** Points for a package landing m metres from the chimney (0 = in it). */
export const nærPoeng = (m: number) =>
  Math.round(PIPE_POENG * Math.max(0, 1 - m / NÆR_M));

/** «RETT I PIPA!» or «3,2 m fra pipa». */
export const landingTekst = (m: number) =>
  m <= 0 ? "RETT I PIPA!" : `${m.toFixed(1).replace(".", ",")} m fra pipa`;

const G = 200;
/** One step of a package's fall: gravity, a little air drag forward, wind drift sideways. */
function fallPakke(p: Pakke, dt: number, gust: number) {
  p.vy -= G * dt;
  p.vz *= Math.max(0, 1 - 0.15 * dt);
  p.x += (p.vx + gust * 0.6) * dt;
  p.alt += p.vy * dt;
  p.z += p.vz * dt;
}

type Slipper = {
  px: number;
  alt: number;
  dist: number;
  vx: number;
  fart: number;
};

const nyPakke = (s: Slipper): Pakke => ({
  x: s.px,
  alt: s.alt,
  z: s.dist,
  vx: s.vx,
  vy: 0,
  // Let go at the sleigh's speed: it falls straight down under the rig, where the camera sees it.
  vz: s.fart,
});

/** Where a package dropped now would fly: points every tenth of a second until it lands. */
export function forutsiPakke(s: Slipper, gust: number): Pakke[] {
  const p = nyPakke(s);
  const ut: Pakke[] = [];
  for (let i = 0; i < 40 && p.alt > 0; i++) {
    fallPakke(p, 0.1, gust);
    ut.push({ ...p });
  }
  return ut;
}

export interface Styring {
  steer: number;
  climb: number;
  sprang: boolean;
  /** Drop a package (edge: set for the frame the button was pressed). */
  slipp?: boolean;
  /** Held throttle, -1 (brake) to 1 (boost); SLEDEFLUKT's held buttons. */
  gass?: number;
}

export type Hendelse =
  | "bjelle"
  | "bom"
  | "nesten"
  | "fugl"
  | "krasj"
  | "skrape"
  | "stjerne"
  | "band"
  | "port"
  | "grotte"
  | "sprang"
  | "nære"
  | "utfordring"
  | "slipp"
  | "levering"
  | "pakkebom"
  | "nærLevering"
  | "leveringKlart"
  | "mål";

export interface SimOpts {
  /** IQ-assistent: never game over, soft altitude hold, wider targets. */
  assist: boolean;
  reduceMotion: boolean;
  /** The day's challenge; met at the finish line it pays its bonus. */
  utfordring?: Utfordring;
  /** The day's delivery mission on stages with houses. */
  levering?: Leveringsoppdrag;
  /** Today's date: teasers with a later `lås` are locked (grey, no points, no crash). */
  dag?: number;
}

/** Score multiplier for a run of rings without a miss: x1, x2 at 3, x3 at 6, x4 at 9. */
export const rekkeMult = (rekke: number) =>
  1 + Math.min(3, Math.floor(rekke / 3));

/** Speed gain from start to finish of a stage. */
export const RAMP = 0.2;

export const ALT_MIN = 40;
export const ALT_MAX = 450;
/** Damage per small hit (a grazed tree or peak, a scrape along the snow); at 1 the hit is a crash. */
export const SKADE_PER_TREFF = 0.34;
export const ALT_CRUISE = 120;

/** Climbing at full stick costs this share of speed, diving gains it. */
export const AERO = 0.15;

/** Seconds for a turn to build or fade; higher feels heavier. */
export const STYRE_TREGHET = 0.5;

export function createSim(e: SledeEtappe, opts: SimOpts) {
  const ting = lagBane(e);
  for (const t of ting)
    t.låst = t.lås !== undefined && (opts.dag ?? 24) < t.lås;
  const soner = ting.filter((t) => t.type === "vind");
  const grotter = ting.filter((t) => t.type === "grotte");
  const hus = ting.filter((t) => t.type === "hus");
  const s = {
    px: 0,
    /** Sideways velocity in track units/s; the stick sets a target it glides to. */
    vx: 0,
    /** The stick as the reins feel it: eases in and out over STYRE_TREGHET. */
    styr: 0,
    /** Speed factor from climbing and diving (AERO). */
    aero: 1,
    /** Sideways velocity the sleigh trails behind the reindeer with (render yaw). */
    slep: 0,
    alt: ALT_CRUISE,
    bank: 0,
    dist: 0,
    fart: 0,
    tid: 0,
    poeng: 0,
    liv: opts.assist ? Infinity : 3,
    varder: 0,
    varderTotalt: ting.filter((t) => t.type === "varde").length,
    stjerner: 0,
    /** Letter birds caught. */
    fugler: 0,
    nære: 0,
    krasj: 0,
    /** Sled damage 0–1 from small hits; reaching 1 is a crash and starts it over. */
    skade: 0,
    sisteSkade: -Infinity,
    /** Rings in a row without a miss; the multiplier is rekkeMult(rekke). */
    rekke: 0,
    besteRekke: 0,
    tidsbonus: 0,
    utfordringKlart: false,
    /** The package in the air, if any; one at a time. */
    pakke: null as Pakke | null,
    /** Packages dropped so far (names the next one), delivered, and lost in the snow. */
    slipp: 0,
    pakker: 0,
    pakkerTotalt: hus.length,
    pakkebom: 0,
    /** Metres from the chimney for the last package that scored (0 = in it). */
    sisteMeter: 0,
    /** The house a landed package was aimed at (nearest within reach), for the chimney's reply. */
    sisteHus: null as Ting | null,
    leveringKlart: false,
    /** Boost meter 0..1, filled by rings; full = sprang available. */
    kraft: 0,
    sprangTil: 0,
    løftTil: 0,
    sakteTil: 0,
    vind: 0,
    /** Sideways push on the sleigh this step; packages drift with it (forutsiPakke). */
    gust: 0,
    ferdig: false,
    tapt: false,
    ting,
    /** First index not yet passed; everything before is behind the camera. */
    first: 0,
  };
  const widen = opts.assist ? 1.4 : 1;
  const motion = opts.reduceMotion ? 0.72 : 1;

  function step(dt: number, inn: Styring): Hendelse[] {
    const ev: Hendelse[] = [];
    if (s.ferdig || s.tapt) return ev;
    s.tid += dt;

    // Wind: inside a gust zone the sleigh drifts sideways; assist halves it.
    const sone = soner.find(
      (t) => t.z <= s.dist && t.z + (t.lengde ?? 0) > s.dist,
    );
    s.vind += ((sone?.kraft ?? 0) - s.vind) * Math.min(1, dt * 3);
    const gust = s.vind * (opts.assist ? 0.25 : 0.55) * e.blanding.vindKraft;
    s.gust = gust;

    // Weight: two lagged stages give an S-curve, so a turn eases in and out
    // over about STYRE_TREGHET; at high speed the reindeer turn less.
    const k = Math.min(1, (dt * 4) / STYRE_TREGHET);
    s.styr += (inn.steer - s.styr) * k;
    const fartsforhold = s.fart > 0 ? s.fart / e.fart : 1;
    const maks = 1.9 * Math.min(1.1, 1 / Math.sqrt(fartsforhold));
    s.vx += (s.styr * maks + gust - s.vx) * k;
    s.slep += (s.vx - s.slep) * Math.min(1, dt * 2.5);
    s.px = Math.max(-1.3, Math.min(1.3, s.px + s.vx * dt));
    if (Math.abs(s.px) >= 1.3) s.vx = 0;
    if (inn.climb !== 0) {
      s.alt += inn.climb * KLATRE * dt;
    } else if (opts.assist) {
      s.alt += (ALT_CRUISE - s.alt) * Math.min(1, dt * 0.8);
    }
    // Diving into the snow is a crash; with the assistant the floor is soft.
    if (
      !opts.assist &&
      inn.climb < 0 &&
      s.alt <= ALT_MIN &&
      s.tid >= s.sakteTil
    ) {
      krasj(ev);
      s.alt = ALT_MIN + 40;
    } else if (!opts.assist && s.alt < ALT_MIN + 8) skrape(ev);
    s.alt = Math.max(ALT_MIN, Math.min(ALT_MAX, s.alt));
    s.bank += (s.vx * 0.28 - s.bank) * Math.min(1, dt * 6);

    if (inn.sprang && s.kraft >= 1 && s.tid > s.sprangTil) {
      s.kraft = 0;
      s.sprangTil = s.tid + 3;
      ev.push("sprang");
    }
    let mult = 1;
    if (s.tid < s.sprangTil) mult *= 1.8;
    if (s.tid < s.løftTil) mult *= 1.3;
    if (s.tid < s.sakteTil) mult *= 0.45;
    // Boost is a risk for the time bonus; the brake buys reading time at its cost.
    const gass = Math.max(-1, Math.min(1, inn.gass ?? 0));
    mult *= gass > 0 ? 1 + 0.2 * gass : 1 + 0.3 * gass;
    // The course gets faster towards the finish, so the last third is the test.
    const ramp = 1 + RAMP * Math.min(1, s.dist / e.lengde);
    // Climbing costs speed, diving gains it; it builds over a second or two.
    s.aero += (1 - AERO * inn.climb - s.aero) * Math.min(1, dt * 1.2);
    mult *= s.aero;
    s.fart = e.fart * mult * motion * ramp;
    // Too slow and the nose drops: braking up a climb stalls gently.
    if (
      !opts.assist &&
      s.tid >= s.sakteTil &&
      s.fart < e.fart * ramp * motion * 0.7
    )
      s.alt = Math.max(ALT_MIN, s.alt - 60 * dt);
    s.dist += s.fart * dt;

    if (inn.slipp && !s.pakke && hus.length) {
      s.pakke = nyPakke(s);
      s.slipp++;
      ev.push("slipp");
    }
    if (s.pakke) {
      const p = s.pakke;
      fallPakke(p, dt, gust);
      const mål = hus.find(
        (t) =>
          !t.treff &&
          Math.abs(t.z - p.z) < 140 &&
          Math.abs(t.x - p.x) < 0.22 * widen &&
          p.alt <= t.h &&
          p.alt > t.h - 45,
      );
      if (mål) {
        mål.treff = true;
        s.pakker++;
        s.poeng += (PIPE_POENG - (mål.nær ?? 0)) * rekkeMult(s.rekke);
        mål.nær = PIPE_POENG;
        s.sisteMeter = 0;
        s.pakke = null;
        ev.push("levering");
      } else if (p.alt <= 0) {
        // Close counts too: points fall with distance, and per house only an improvement pays.
        let nærmest: Ting | null = null;
        let m = NÆR_M;
        s.sisteHus = null;
        let nærZ = 1500;
        for (const h of hus) {
          const d = meterFraPipa(p, h);
          if (d < m) {
            m = d;
            nærmest = h;
          }
          if (Math.abs(h.z - p.z) < nærZ) {
            nærZ = Math.abs(h.z - p.z);
            s.sisteHus = h;
          }
        }
        const poeng = nærPoeng(m);
        if (nærmest && poeng > 0) {
          if (poeng > (nærmest.nær ?? 0)) {
            s.poeng += (poeng - (nærmest.nær ?? 0)) * rekkeMult(s.rekke);
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

    // Light is dropped by flying low anywhere over the cave crack (stage 4).
    for (const g of grotter) {
      if (g.låst || g.treff || g.z > s.dist || g.z + (g.lengde ?? 0) < s.dist)
        continue;
      if (s.alt < 100 && Math.abs(s.px - g.x) < 0.8) {
        g.treff = true;
        s.poeng += 150;
        ev.push("grotte");
      }
    }

    // Everything that crossed the sleigh this step.
    while (s.first < ting.length && ting[s.first].z <= s.dist) {
      const t = ting[s.first];
      if (!t.ferdig) passer(t, ev);
      t.ferdig = true;
      s.first++;
    }

    if (s.dist >= e.lengde) {
      s.ferdig = true;
      if (!opts.assist) {
        s.tidsbonus =
          Math.max(0, Math.round((e.lengde / e.fart) * 1.5 - s.tid)) * 20;
        s.poeng += s.tidsbonus;
      }
      const u = opts.utfordring;
      if (u && utfordringKlart(u, s)) {
        s.utfordringKlart = true;
        s.poeng += u.bonus;
        ev.push("utfordring");
      }
      const l = opts.levering;
      if (l && s.pakker >= l.mål) {
        s.leveringKlart = true;
        s.poeng += l.bonus;
        ev.push("leveringKlart");
      }
      ev.push("mål");
    }
    return ev;
  }

  function passer(t: Ting, ev: Hendelse[]) {
    // A locked place is only scenery: nothing to score, nothing to hit.
    if (t.låst) return;
    const dx = Math.abs(s.px - t.x);
    const boost = (s.tid < s.sprangTil ? 2 : 1) * rekkeMult(s.rekke);
    switch (t.type) {
      case "varde": {
        // Through the ring: an ellipse around its centre; the bullseye pays more.
        const avvik = ringAvvik(s.px, s.alt, t);
        if (avvik < widen) {
          t.treff = true;
          s.varder++;
          s.poeng += (avvik < 0.4 ? 150 : 100) * boost;
          s.kraft = Math.min(1, s.kraft + 0.25);
          s.rekke++;
          s.besteRekke = Math.max(s.besteRekke, s.rekke);
          ev.push("bjelle");
        } else {
          s.rekke = 0;
          ev.push(avvik < widen * 1.8 ? "nesten" : "bom");
        }
        break;
      }
      case "stjerne":
        if (dx < 0.2 * widen && Math.abs(s.alt - t.h) < 35 * widen) {
          t.treff = true;
          s.stjerner++;
          s.poeng += 25 * boost;
          ev.push("stjerne");
        }
        break;
      case "fugl":
        // A letter bird flies into the sack: a bonus and a little boost.
        if (dx < 0.3 * widen && Math.abs(s.alt - t.h) < 45 * widen) {
          t.treff = true;
          s.fugler++;
          s.poeng += 80 * boost;
          s.kraft = Math.min(1, s.kraft + 0.15);
          ev.push("fugl");
        }
        break;
      case "band":
        if (dx < 0.6 && s.alt > 150) {
          t.treff = true;
          s.poeng += 50;
          s.løftTil = s.tid + 2;
          ev.push("band");
        }
        break;
      case "tre":
        if (dx < 0.22 && s.alt < t.h - 10) krasj(ev);
        else if (dx < 0.28 && s.alt < t.h) skrape(ev);
        else if (dx < 0.4 && s.alt < t.h + 30) nære(ev);
        break;
      case "topp":
        if (dx < 0.45 && s.alt < (opts.assist ? 190 : t.h)) krasj(ev);
        else if (dx < 0.55 && s.alt < t.h) skrape(ev);
        else if (dx < 0.7 && s.alt < t.h + 40) nære(ev);
        break;
      case "mur":
        if (Math.abs(s.px - (t.port ?? 0)) < 0.35 * widen || s.alt > t.h + 10) {
          t.treff = true;
          s.poeng += 500;
          ev.push("port");
        } else krasj(ev);
        break;
    }
  }

  // Skimming past an obstacle is rewarded, so the brave line is the fast line.
  function nære(ev: Hendelse[]) {
    s.nære++;
    s.poeng += 40;
    s.kraft = Math.min(1, s.kraft + 0.1);
    ev.push("nære");
  }

  function skrape(ev: Hendelse[]) {
    // One scrape per pass, not one per frame.
    if (s.tid - s.sisteSkade < 0.6) return;
    s.sisteSkade = s.tid;
    s.skade += SKADE_PER_TREFF;
    if (s.skade >= 1) {
      s.skade = 0;
      krasj(ev);
    } else ev.push("skrape");
  }

  function krasj(ev: Hendelse[]) {
    s.krasj++;
    s.sisteSkade = s.tid;
    s.rekke = 0;
    s.sakteTil = s.tid + 1.2;
    s.sprangTil = 0;
    if (!opts.assist) {
      s.liv--;
      if (s.liv <= 0) s.tapt = true;
    }
    ev.push("krasj");
  }

  return { s, step };
}

export type Sim = ReturnType<typeof createSim>;

type Telling = {
  varder: number;
  krasj: number;
  stjerner: number;
  tid: number;
  besteRekke: number;
  nære: number;
};

export function utfordringKlart(u: Utfordring, s: Telling) {
  switch (u.type) {
    case "varder":
      return s.varder >= u.mål;
    case "renflyging":
      return s.krasj === 0;
    case "stjerner":
      return s.stjerner >= u.mål;
    case "tid":
      return s.tid < u.mål;
    case "rekke":
      return s.besteRekke >= u.mål;
    case "nære":
      return s.nære >= u.mål;
  }
}

/** Progress line for the HUD: «12/20», «38 s / 50», «REN» or «KRASJ». */
export function utfordringStatus(u: Utfordring, s: Telling) {
  switch (u.type) {
    case "varder":
      return `${s.varder}/${u.mål}`;
    case "renflyging":
      return s.krasj === 0 ? "REN" : "KRASJ";
    case "stjerner":
      return `${s.stjerner}/${u.mål}`;
    case "tid":
      return `${Math.floor(s.tid)} s / ${u.mål}`;
    case "rekke":
      return `${s.besteRekke}/${u.mål}`;
    case "nære":
      return `${s.nære}/${u.mål}`;
  }
}

/**
 * Rampenissen on the sled radio: one short line per event, nordlandsk
 * (docs/manus/rampenissen-radio-2026.md «Skrivemåte»). No clues, no codes;
 * names stay in bokmål. Visible from day 8 (synlig-tekst.ts).
 */
export const RADIO: Record<string, readonly string[]> = {
  fugl: [
    "Ka du sei! Du fanga en brevfugl. Den hadde post te Julius.",
    "Brevfugl i sekken! Æ håpe den ikkje bæsja på pakkan.",
    "Fin fangst! Fuglen sei takk, trur æ.",
  ],
  krasj: [
    "Klonk. Æ såg ingenting, æ. Rudolf såg alt.",
    "Snø i ansiktet e bra for huden, sei Hjerterud.",
    "Æ sa et ord Julius ikkje like. Inni mæ.",
  ],
  nesten: [
    "Nesten! Æ telte den, men IQ gjord det ikkje.",
    "Så nære at ringen blei nervøs.",
  ],
  levering: [
    "Rett i pipa! Dem får sot på gaven, men gave e gave.",
    "Bra jobba! Kaffen te pappaen der inne blei akkurat svart.",
  ],
  pakkebom: [
    "Pakken ligg i snøen. Nån finn den te påske.",
    "Oi. Det der va ikkje pipa. Det va en hage.",
  ],
  utfordring: ["Utfordring klart! Æ sei det på Morgenrådet i morra."],
  mål: [
    "I mål! Rudolf vil ha nåkka godt og æ vil ha kaffe.",
    "Landa! IQ nikke. Det e det nærmaste han kjem et smil.",
  ],
  sprang: ["SPRANG! Hold dæ fast, det her e ikkje lov på jorda."],
  port: ["Gjennom porten! Varmen slapp dæ inn."],
  låst: [
    "Stengt! Det der åpne seinar, sei IQ. Fly ein annen plass så lenge.",
    "Låst, sjø. Kom tilbake når dagen kjem.",
  ],
  snu: [
    "Hei! Lysgardina e enden på kartet. Snu, Rudolf!",
    "Lenger enn det her flyg vi ikkje i kveld. Snu!",
  ],
  grotte: ["Lyset nådde ned i grotta! Krystallan blinke."],
};

/** The n-th radio line for an event, or null when Rampenissen has nothing to say. */
export const radiolinje = (h: string, n: number) => {
  const l = RADIO[h];
  return l ? l[n % l.length] : null;
};

/** Rings needed for one, two and three bells (40, 70 and 90 %). */
export const bjelleKrav = (totalt: number) =>
  [0.4, 0.7, 0.9].map((a) => Math.ceil(a * totalt));

/** 0–3 bells: how many rings were taken, and a clean run for the third. */
export function bjeller(varder: number, totalt: number, krasj: number): number {
  if (!totalt) return 0;
  const [en, to, tre] = bjelleKrav(totalt);
  if (varder >= tre && krasj === 0) return 3;
  if (varder >= to) return 2;
  if (varder >= en) return 1;
  return 0;
}

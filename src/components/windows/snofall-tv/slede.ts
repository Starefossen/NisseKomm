/**
 * IQs sledesimulator: stages, course generation and the pure simulation.
 * No DOM here, so stage gating, scoring and the assist rules are testable.
 * The player moves in x (track units, 0 = centre) and altitude; the world
 * rolls towards the camera in z. Collisions are checked when a thing crosses z = 0.
 */

export type EtappeId = "tundra" | "nordtoppen" | "muren" | "julenatt";

export interface SledeEtappe {
  id: EtappeId;
  /** First December day the stage can be flown (storyboard days 18, 20, 21, 24). */
  dag: number;
  navn: string;
  /** One line from IQ on the start screen. */
  intro: string;
  /** Course length in world units; ~900 units/s. */
  lengde: number;
  fart: number;
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

export const ETAPPER: readonly SledeEtappe[] = [
  {
    id: "tundra",
    dag: 18,
    navn: "Tundra-testen",
    intro:
      "Nyoverhalt slede. Hold kursen etter vardene, så ser vi om tømmene holder!",
    lengde: 40000,
    fart: 900,
    horisont: { fil: "feed/slede-tundra.jpg", linje: 0.69 },
    himmel: ["#050816", "#141c3a"],
    snø: ["#d2e1f5", "#b9cdeb"],
    dis: "#93a6c6",
    nordlys: 0.25,
    tåke: false,
    snøfall: 40,
  },
  {
    id: "nordtoppen",
    dag: 20,
    navn: "Nordlys-strømmen",
    intro: "Himmelen knitrer! Fly inn i lysbåndene, de gir løft over tindene.",
    lengde: 60000,
    fart: 1000,
    horisont: { fil: "feed/slede-nordtoppen.jpg", linje: 0.735 },
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
    fart: 900,
    horisont: { fil: "feed/slede-muren.jpg", linje: 0.69 },
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
    fart: 950,
    horisont: { fil: "feed/slede-julenatt.jpg", linje: 0.72 },
    himmel: ["#02040c", "#0b1430"],
    snø: ["#d9e4f5", "#c0d2ec"],
    dis: "#8ea4c8",
    nordlys: 0.15,
    tåke: false,
    snøfall: 20,
  },
];

export const etapperFor = (day: number) => ETAPPER.filter((e) => day >= e.dag);

export type TingType =
  "varde" | "tre" | "topp" | "vind" | "band" | "stjerne" | "mur" | "grotte";

export interface Ting {
  z: number;
  x: number;
  type: TingType;
  /** Height for obstacles, target altitude for stars. */
  h: number;
  /** Wind: force sign and length in z. Gate (mur): the open gate's x. */
  kraft?: number;
  lengde?: number;
  port?: number;
  /** Set once the thing has been passed (hit or missed). */
  ferdig?: boolean;
  treff?: boolean;
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

export function lagBane(e: SledeEtappe): Ting[] {
  const r = rng(e.dag * 7919 + e.lengde);
  const out: Ting[] = [];
  const slutt = e.lengde - 2500;
  let lane = 0;
  for (let z = 1500, i = 0; z < slutt; z += SEG, i++) {
    const u = r();
    // Beacons weave left and right so the course is a slalom, never a straight line.
    if (i % 3 === 0) {
      lane = Math.max(-0.7, Math.min(0.7, lane + (r() - 0.5) * 0.9));
      out.push({ z, x: lane, type: "varde", h: 90 });
      continue;
    }
    if (e.id === "julenatt" && i % 23 === 11) {
      out.push({ z, x: 0, type: "grotte", h: 0, lengde: 1600 });
      z += 1600;
      continue;
    }
    if (e.id === "nordtoppen" && i % 9 === 4) {
      out.push({ z, x: lane * 0.5, type: "band", h: 200 });
      continue;
    }
    if (e.id === "nordtoppen" && u < 0.35) {
      out.push({ z, x: (r() - 0.5) * 1.6, type: "topp", h: 230 });
      continue;
    }
    if (u < 0.3 && e.id !== "muren") {
      out.push({
        z,
        x: lane + (r() - 0.5) * 1.2,
        type: "stjerne",
        h: 70 + r() * 160,
      });
      continue;
    }
    if (u < 0.55 || e.id === "muren") {
      const side = r() < 0.5 ? -1 : 1;
      out.push({
        z,
        x: lane + side * (0.55 + r() * 0.9),
        type: "tre",
        h: 160,
      });
      continue;
    }
    if (u < 0.7) {
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
  if (e.id === "muren") {
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

export interface Styring {
  steer: number;
  climb: number;
  sprang: boolean;
}

export type Hendelse =
  | "bjelle"
  | "bom"
  | "krasj"
  | "stjerne"
  | "band"
  | "port"
  | "grotte"
  | "sprang"
  | "nære"
  | "mål";

export interface SimOpts {
  /** IQ-assistent: never game over, soft altitude hold, wider targets. */
  assist: boolean;
  reduceMotion: boolean;
}

/** Score multiplier for a run of beacons without a miss: x1, x2 at 3, x3 at 6, x4 at 9. */
export const rekkeMult = (rekke: number) =>
  1 + Math.min(3, Math.floor(rekke / 3));

/** Speed gain from start to finish of a stage. */
export const RAMP = 0.2;

export const ALT_MIN = 40;
export const ALT_MAX = 270;
export const ALT_CRUISE = 120;

export function createSim(e: SledeEtappe, opts: SimOpts) {
  const ting = lagBane(e);
  const soner = ting.filter((t) => t.type === "vind");
  const grotter = ting.filter((t) => t.type === "grotte");
  const s = {
    px: 0,
    /** Sideways velocity in track units/s; the stick sets a target it glides to. */
    vx: 0,
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
    nære: 0,
    krasj: 0,
    /** Beacons in a row without a miss; the multiplier is rekkeMult(rekke). */
    rekke: 0,
    besteRekke: 0,
    tidsbonus: 0,
    /** Boost meter 0..1, filled by beacons; full = sprang available. */
    kraft: 0,
    sprangTil: 0,
    løftTil: 0,
    sakteTil: 0,
    vind: 0,
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
    const gust = s.vind * (opts.assist ? 0.25 : 0.55);

    // Inertia: a quick tap nudges, a held stick builds to full speed in ~0.3 s.
    s.vx += (inn.steer * 1.9 + gust - s.vx) * Math.min(1, dt * 9);
    s.px = Math.max(-1.3, Math.min(1.3, s.px + s.vx * dt));
    if (Math.abs(s.px) >= 1.3) s.vx = 0;
    if (inn.climb !== 0) {
      s.alt += inn.climb * 150 * dt;
    } else if (opts.assist) {
      s.alt += (ALT_CRUISE - s.alt) * Math.min(1, dt * 0.8);
    }
    s.alt = Math.max(ALT_MIN, Math.min(ALT_MAX, s.alt));
    s.bank += (s.vx * 0.2 - s.bank) * Math.min(1, dt * 6);

    if (inn.sprang && s.kraft >= 1 && s.tid > s.sprangTil) {
      s.kraft = 0;
      s.sprangTil = s.tid + 3;
      ev.push("sprang");
    }
    let mult = 1;
    if (s.tid < s.sprangTil) mult *= 1.8;
    if (s.tid < s.løftTil) mult *= 1.3;
    if (s.tid < s.sakteTil) mult *= 0.45;
    // The course gets faster towards the finish, so the last third is the test.
    const ramp = 1 + RAMP * Math.min(1, s.dist / e.lengde);
    s.fart = e.fart * mult * motion * ramp;
    s.dist += s.fart * dt;

    // Light is dropped by flying low anywhere over the cave crack (stage 4).
    for (const g of grotter) {
      if (g.treff || g.z > s.dist || g.z + (g.lengde ?? 0) < s.dist) continue;
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
      ev.push("mål");
    }
    return ev;
  }

  function passer(t: Ting, ev: Hendelse[]) {
    const dx = Math.abs(s.px - t.x);
    const boost = (s.tid < s.sprangTil ? 2 : 1) * rekkeMult(s.rekke);
    switch (t.type) {
      case "varde":
        if (dx < 0.4 * widen && s.alt < 230) {
          t.treff = true;
          s.varder++;
          s.poeng += (dx < 0.15 ? 150 : 100) * boost;
          s.kraft = Math.min(1, s.kraft + 0.25);
          s.rekke++;
          s.besteRekke = Math.max(s.besteRekke, s.rekke);
          ev.push("bjelle");
        } else {
          s.rekke = 0;
          ev.push("bom");
        }
        break;
      case "stjerne":
        if (dx < 0.2 * widen && Math.abs(s.alt - t.h) < 35 * widen) {
          t.treff = true;
          s.stjerner++;
          s.poeng += 25 * boost;
          ev.push("stjerne");
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
        else if (dx < 0.4 && s.alt < t.h + 30) nære(ev);
        break;
      case "topp":
        if (dx < 0.45 && s.alt < (opts.assist ? 190 : t.h)) krasj(ev);
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

  function krasj(ev: Hendelse[]) {
    s.krasj++;
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

/** 0–3 bells: how many beacons were taken, and a clean run for the third. */
export function bjeller(varder: number, totalt: number, krasj: number): number {
  const andel = totalt ? varder / totalt : 0;
  if (andel >= 0.9 && krasj === 0) return 3;
  if (andel >= 0.7) return 2;
  if (andel >= 0.4) return 1;
  return 0;
}

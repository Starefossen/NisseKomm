/**
 * Ugleposten mini-puzzles as pure functions. Configs are data in a chapter's
 * `puslespill` map (format: see the top of motor.ts); the UI is Puslespill.tsx.
 */

export type Puslespill =
  /** Combination lock: one symbol list per wheel; `svar` is the symbol per wheel. */
  | { type: "laas"; hjul: string[][]; svar: string[] }
  /** 3×3 sliding tiles. `bilde` (media path) is cut into tiles; without it, numbered tiles. */
  | { type: "skyv"; bilde?: string; trekk?: number; seed?: number }
  /** Radio dial from `min` to `max`; solved within `toleranse` of `maal`. */
  | {
      type: "radio";
      min: number;
      max: number;
      maal: number;
      toleranse: number;
      steg?: number;
      enhet?: string;
    }
  /**
   * Rotate pieces to connect S to M. Rows of: S start, M goal, | straight,
   * L corner, T tee, + cross, . empty. `start` = quarter turns per cell, row-major.
   */
  | { type: "rute"; rutenett: string[]; start?: number[] };

export type PuslespillDef = Puslespill & {
  tittel: string;
  /** Flag set when solved (tie a Gaate to it for TIPS). */
  flagg: string;
  /** Line shown after solving. */
  tekst: string;
};

// --- Lock ---

export const laasDrei = (
  p: { hjul: string[][] },
  st: number[],
  i: number,
  d: 1 | -1,
) => st.map((v, j) => (j === i ? (v + d + p.hjul[i].length) % p.hjul[i].length : v));

export const laasApen = (p: { hjul: string[][]; svar: string[] }, st: number[]) =>
  p.svar.every((s, i) => p.hjul[i][st[i]] === s);

// --- Sliding tiles (value 8 is the hole; solved = [0..8]) ---

export const HULL = 8;

function rng(seed: number) {
  // mulberry32: tiny seeded PRNG so a scramble is reproducible in tests
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const naboer = (i: number) =>
  [i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 < 2 ? i + 1 : -1].filter(
    (j) => j >= 0 && j < 9,
  );

/** Moves tile `i` into the hole if adjacent; otherwise unchanged. */
export function skyvFlytt(st: number[], i: number): number[] {
  const h = st.indexOf(HULL);
  if (!naboer(h).includes(i)) return st;
  const ny = [...st];
  [ny[h], ny[i]] = [ny[i], ny[h]];
  return ny;
}

export const skyvLost = (st: number[]) => st.every((v, i) => v === i);

/** Odd width: solvable iff the tile inversion count is even. */
export function skyvLosbar(st: number[]): boolean {
  const t = st.filter((v) => v !== HULL);
  let inv = 0;
  for (let i = 0; i < t.length; i++)
    for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) inv++;
  return st.length === 9 && new Set(st).size === 9 && inv % 2 === 0;
}

/** Random legal moves from solved, so always solvable; never returns solved. */
export function skyvStokk(trekk = 40, seed = Date.now()): number[] {
  const r = rng(seed);
  let st = [0, 1, 2, 3, 4, 5, 6, 7, HULL];
  let forrige = -1;
  for (let n = 0; n < trekk || skyvLost(st); n++) {
    const h = st.indexOf(HULL);
    const valg = naboer(h).filter((j) => j !== forrige);
    const j = valg[Math.floor(r() * valg.length)];
    st = skyvFlytt(st, j);
    forrige = h;
  }
  return st;
}

// --- Radio ---

/** 0..1, peaks at the target and fades to 0 a quarter of the dial away. */
export function radioSignal(
  p: { min: number; max: number; maal: number },
  v: number,
) {
  const bredde = (p.max - p.min) / 4;
  return Math.max(0, 1 - Math.abs(v - p.maal) / bredde);
}

export const radioInne = (
  p: { maal: number; toleranse: number },
  v: number,
) => Math.abs(v - p.maal) <= p.toleranse;

// --- Route (bits: N=1 E=2 S=4 W=8) ---

const BITS: Record<string, number> = {
  S: 15,
  M: 15,
  "|": 5,
  L: 3,
  T: 14,
  "+": 15,
  ".": 0,
};
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];
const motsatt = (d: number) => (d + 2) % 4;

/** Openings of a piece after `r` clockwise quarter turns. */
export const ruteAapninger = (tegn: string, r: number) => {
  const b = BITS[tegn] ?? 0;
  const k = ((r % 4) + 4) % 4;
  return ((b << k) | (b >> (4 - k))) & 15;
};

const finn = (g: string[], t: string): [number, number] => {
  const r = g.findIndex((row) => row.includes(t));
  return [r, r < 0 ? -1 : g[r].indexOf(t)];
};

/** True when open pipes run from S to M with the given rotations. */
export function ruteKoblet(p: { rutenett: string[] }, rot: number[]): boolean {
  const g = p.rutenett;
  const w = g[0].length;
  const [sr, sc] = finn(g, "S");
  const sett = new Set([sr * w + sc]);
  const ko = [[sr, sc]];
  while (ko.length) {
    const [r, c] = ko.pop()!;
    if (g[r][c] === "M") return true;
    const a = ruteAapninger(g[r][c], rot[r * w + c] ?? 0);
    for (let d = 0; d < 4; d++) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      if (!(a & (1 << d)) || nr < 0 || nc < 0 || nr >= g.length || nc >= w)
        continue;
      const b = ruteAapninger(g[nr][nc], rot[nr * w + nc] ?? 0);
      if (b & (1 << motsatt(d)) && !sett.has(nr * w + nc)) {
        sett.add(nr * w + nc);
        ko.push([nr, nc]);
      }
    }
  }
  return false;
}

/** Can some rotation of the pieces form a simple path S→M? */
function ruteLosbar(g: string[]): boolean {
  const w = g[0].length;
  const kan = (t: string, inn: number, ut: number) =>
    [0, 1, 2, 3].some((r) => {
      const a = ruteAapninger(t, r);
      return a & (1 << inn) && a & (1 << ut);
    });
  const sett = new Set<number>();
  const gaa = (r: number, c: number, inn: number): boolean => {
    if (g[r][c] === "M") return true;
    sett.add(r * w + c);
    for (let d = 0; d < 4; d++) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      if (nr < 0 || nc < 0 || nr >= g.length || nc >= w) continue;
      if (sett.has(nr * w + nc) || g[nr][nc] === ".") continue;
      if (inn >= 0 && !kan(g[r][c], inn, d)) continue;
      if (gaa(nr, nc, motsatt(d))) return true;
    }
    sett.delete(r * w + c);
    return false;
  };
  const [sr, sc] = finn(g, "S");
  return gaa(sr, sc, -1);
}

/** Problems with a route config; empty means playable. */
export function ruteFeil(p: { rutenett: string[]; start?: number[] }): string[] {
  const g = p.rutenett;
  const feil: string[] = [];
  const alle = g.join("");
  if (!g.length || g.some((r) => r.length !== g[0].length))
    feil.push("rutenettet må være rektangulært");
  if ([...alle].some((t) => !(t in BITS))) feil.push("ukjent tegn");
  if (alle.split("S").length !== 2 || alle.split("M").length !== 2)
    feil.push("trenger nøyaktig én S og én M");
  if (feil.length) return feil;
  if (!ruteLosbar(g)) feil.push("kan ikke løses");
  else if (ruteKoblet(p, p.start ?? [])) feil.push("er løst fra start");
  return feil;
}

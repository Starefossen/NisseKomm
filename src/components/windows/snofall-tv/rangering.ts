import { ETAPPER, lagBane, rekkeMult, type SledeEtappe } from "./slede";

/**
 * Fixed rival scores from Snøfall (issue #4): computed per stage, never saved.
 * Julius flies steady and good, Winter exact to the point (an unrounded score),
 * Pil fast but crashing and missing chimneys. A good run beats all three.
 */
export interface Rival {
  navn: string;
  om: string;
  poeng: number;
}

/** A clean bullseye run: every ring in one streak, every bird, the gate. */
export function toppPoeng(e: SledeEtappe): number {
  let p = 0;
  let rekke = 0;
  for (const t of lagBane(e)) {
    if (t.låst) continue;
    if (t.type === "varde") p += 150 * rekkeMult(rekke++);
    else if (t.type === "fugl") p += 80;
    else if (t.type === "mur") p += 500;
    else if (t.type === "band") p += 50;
    else if (t.type === "grotte") p += 150;
  }
  return p;
}

export function rivaler(e: SledeEtappe): Rival[] {
  // Later stages crash more, so the rivals' share of the top score falls per stage.
  const j = toppPoeng(e) * 0.5 * (1 - 0.08 * ETAPPER.indexOf(e));
  return [
    { navn: "Julius", om: "jevn og god", poeng: Math.round(j / 50) * 50 },
    { navn: "Winter", om: "nøyaktig", poeng: Math.round(j * 0.7) + 3 },
    {
      navn: "Pil",
      om: "rask, men bommer",
      poeng: Math.round((j * 0.45) / 10) * 10,
    },
  ];
}

export interface Plass {
  navn: string;
  poeng: number;
  rival: boolean;
  om?: string;
}

/** Kids' bests and the rivals, best first; a tie puts the kids ahead. */
export function rangering(
  e: SledeEtappe,
  barn: { navn: string; poeng: number }[],
): Plass[] {
  return [
    ...barn.map((b) => ({ ...b, rival: false })),
    ...rivaler(e).map((r) => ({ ...r, rival: true })),
  ].sort((a, b) => b.poeng - a.poeng || Number(a.rival) - Number(b.rival));
}

/** Whether this score beats Julius on the stage. */
export const slårJulius = (e: SledeEtappe, poeng: number) =>
  poeng >= rivaler(e)[0].poeng;

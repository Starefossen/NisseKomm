/**
 * The budget line in Gjennomgang's queue: the same sum as assets/bin/forbruk.py
 * (`kostnad(siden(BUDSJETT_FRA))`). forbruk.test.ts runs both on one log.
 */
export const PRIS = { video: 17, bilde: 1.4, tts: 0.1, transkripsjon: 0.1 };
export const BUDSJETT = 2000;
export const BUDSJETT_FRA = "2026-11-13";

/** Spent and left since BUDSJETT_FRA, from forbruk.jsonl text (local ISO times, like python's date()). */
export function forbruk(jsonl: string) {
  let brukt = 0;
  for (const l of jsonl.split("\n")) {
    if (!l.trim()) continue;
    const r = JSON.parse(l) as {
      t: string;
      type: keyof typeof PRIS;
      antall?: number;
    };
    if (r.t.slice(0, 10) >= BUDSJETT_FRA)
      brukt += PRIS[r.type] * (r.antall ?? 1);
  }
  return {
    brukt,
    igjen: BUDSJETT - brukt,
    budsjett: BUDSJETT,
    fra: BUDSJETT_FRA,
  };
}

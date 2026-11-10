/**
 * Frostgraden and frost mode (historie-2026 §1 and §6, storyboard-2026 §2).
 * Pure functions; GameEngine wraps them with stored progress and the clock.
 */

// [morning, after code, after bonus] per day. Storyboard §2 is the source.
// ponytail: lives here, not in oppdrag JSON, because lane 1 owns that JSON.
const FROST_TABLE: Record<number, [number, number, number?]> = {
  7: [30, 22],
  8: [34, 28],
  9: [40, 32],
  10: [71, 45],
  11: [62, 48, 28],
  12: [55, 32],
  13: [44, 36],
  14: [50, 40],
  15: [56, 46],
  16: [63, 50, 30],
  17: [52, 42],
  18: [60, 48],
  19: [68, 56],
  20: [88, 76],
  21: [94, 32],
  22: [40, 24],
  23: [30, 10],
  24: [12, 0],
};

/** Frost percentage for a day, or null on days 1–6 (no name, no measurement). */
export function frostLevelFor(
  day: number,
  solved: boolean,
  bonusSolved = false,
): number | null {
  const row = FROST_TABLE[day];
  if (!row) return null;
  const [morning, afterCode, afterBonus] = row;
  if (!solved) return morning;
  return bonusSolved && afterBonus !== undefined ? afterBonus : afterCode;
}

export type FrostModeLevel = 0 | 1 | 2;

export interface FrostMode {
  level: FrostModeLevel;
  /** Kulde's line, at most 120 characters. Empty when level is 0. */
  message: string;
}

const FROST_DAYS: Record<number, { level: 1 | 2; message: string }> = {
  10: { level: 1, message: "Fargene er hos meg nå. 71 %" },
  21: {
    level: 2,
    message: "Det er kaldt her nede. Jeg ville bare se lyset deres. 94 %",
  },
};

/** Emergency stop: an unsolved frost day never stays frozen overnight. */
export const FROST_UNTIL_HOUR = 20;

export function isFrostDay(day: number): boolean {
  return day in FROST_DAYS;
}

export function frostModeFor(opts: {
  day: number;
  month: number;
  hour: number;
  solved: boolean;
  disabled: boolean;
}): FrostMode {
  const entry = FROST_DAYS[opts.day];
  if (
    !entry ||
    opts.month !== 12 ||
    opts.solved ||
    opts.disabled ||
    opts.hour >= FROST_UNTIL_HOUR
  ) {
    return { level: 0, message: "" };
  }
  return { level: entry.level, message: entry.message };
}

/** Windows that still work while the app is frozen (level 2). */
export const FROST_OPEN_WINDOWS = [
  "nissemail",
  "dagbok",
  "kodeterminal",
  "nissenet",
];
/** The only NisseNet folder readable during level 2 (meta 2: Trixter's map). */
export const FROST_OPEN_FOLDER = "DEKRYPTERT";

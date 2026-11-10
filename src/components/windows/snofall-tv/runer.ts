import { KULDE_INTERCEPTS } from "./channels";

/** T12: Kulde's own voice in Frostrunene under the ghost line (app-tekster A6). */
export const KULDE_RUNER: Record<number, string> = {
  10: "SE MEG",
  13: "ALENE",
  16: "SE OPP",
  21: "LYSET DERES",
};

/** Rune line for the ghost image shown on `day` (latest intercept so far). */
export function latestRuneLine(day: number): string | undefined {
  const days = Object.keys(KULDE_INTERCEPTS)
    .map(Number)
    .filter((d) => d <= day);
  return days.length ? KULDE_RUNER[Math.max(...days)] : undefined;
}

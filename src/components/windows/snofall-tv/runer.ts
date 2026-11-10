/** T12: Kulde's own voice in Frostrunene under the ghost line (app-tekster A6). */
export const KULDE_RUNER: Record<number, string> = {
  10: "SE MEG",
  13: "ALENE",
  16: "SE OPP",
  21: "LYSET DERES",
};

/** Rune line under the ghost image shown on `day`. */
export function runeLineFor(day: number): string | undefined {
  return KULDE_RUNER[day];
}

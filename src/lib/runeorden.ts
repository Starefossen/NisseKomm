import { getAllOppdrag } from "@/lib/oppdrag";

/*
 * Meta 1 learning order (gaater-2026): which runes the house's cards show,
 * day by day. Per card day: the code's letters, minus letters no card stands
 * for (`uten`), plus decoy letters (`ekstra`). A rune is NEW on the first
 * day it is printed; a ❄ card only carries a rune when it is new that day.
 */
const KORTDAGER: Record<number, { uten?: string; ekstra?: string }> = {
  1: { ekstra: "ET" },
  3: {},
  4: {},
  6: { ekstra: "AO" },
  7: {},
  8: { uten: "T", ekstra: "E" },
  10: { ekstra: "R" },
  12: { ekstra: "A" },
  13: { ekstra: "NRL" },
  14: {},
  15: { uten: "KAREL" },
  16: { uten: "SRTRNG", ekstra: "K" },
  17: {},
  18: { uten: "TRULN" },
  19: { uten: "GRT" },
  20: {},
  21: { ekstra: "U" },
  23: {},
  24: { uten: "JLMAI" },
};

/** Every rune printed on day `dag`'s cards (with repeats), ❄ cards' hidden letters included. */
export function kortRuner(dag: number): string[] {
  const k = KORTDAGER[dag];
  if (!k) return [];
  const l = [
    ...getAllOppdrag()
      .find((o) => o.dag === dag)!
      .kode.toUpperCase(),
  ];
  for (const c of k.uten ?? "") {
    const i = l.indexOf(c);
    if (i < 0) throw new Error(`${c} er ikke i koden for dag ${dag}`);
    l.splice(i, 1);
  }
  return [...l, ...(k.ekstra ?? "")];
}

/** Runes shown for the first time on day `dag`. */
export function nyeRuner(dag: number): Set<string> {
  const før = new Set<string>();
  for (let d = 1; d < dag; d++) kortRuner(d).forEach((c) => før.add(c));
  return new Set(kortRuner(dag).filter((c) => !før.has(c)));
}

/** Runes shown on any card before day `dag`. */
export function runerFør(dag: number): Set<string> {
  const s = new Set<string>();
  for (let d = 1; d < dag; d++) nyeRuner(d).forEach((c) => s.add(c));
  return s;
}

/** Corner rune for a ❄ card: its hidden letter, only when new that day. */
export const skjultRune = (dag: number, l: string | null | undefined) =>
  l && nyeRuner(dag).has(l) ? l : undefined;

/**
 * Cut-off corners: per card, the new letter that card's corner carries.
 * One corner per new letter per day, on the first card that shows it.
 */
export function klipphjorner(
  dag: number,
  kort: (string | null | undefined)[],
): (string | undefined)[] {
  const nye = nyeRuner(dag);
  const brukt = new Set<string>();
  return kort.map((l) => {
    if (!l || !nye.has(l) || brukt.has(l)) return undefined;
    brukt.add(l);
    return l;
  });
}

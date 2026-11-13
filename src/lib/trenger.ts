/** «Trenger mer» (?): what Hans needs before he can judge; not a verdict. */
export const TRENGER = {
  skisse: "skisse",
  forklaring: "forklaring",
  utskrift: "utskrift-forhåndsvisning",
  eksempel: "eksempel",
  gjennomspilling: "gjennomspilling",
} as const;
export type TrengerHva = keyof typeof TRENGER;
/** `levert` when the agent delivered, `lest` when Hans judged after that. */
export interface Trenger {
  hva: TrengerHva;
  notat?: string;
  når: string;
  levert?: string;
  lest?: string;
}

/** «trenger skisse: notat (levert)» for list_vurderinger and queue lines. */
export const trengerLinje = (t?: Trenger) =>
  t
    ? ` | trenger ${TRENGER[t.hva]}${t.notat ? `: ${t.notat}` : ""}${t.lest ? " (levert, sett)" : t.levert ? " (levert)" : ""}`
    : "";

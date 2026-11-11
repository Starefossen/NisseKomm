/**
 * Ugleposten: the point-and-click rules as pure functions over the save.
 * Scenes are data (kapittel*.ts); the UI (Nissespill.tsx) only renders and dispatches.
 * Hotspot rects are percent of the 16:9 still so they follow the image on any screen.
 *
 * Data format for chapter authors (examples in motor.test.ts, fixture KAP):
 * - Conditions (`vis`, `ta`, `bruker`, `Valg`, `Linje` variants): `hvis`, `uten`,
 *   plus `alle: Vilkaar[]` (AND) and `en_av: Vilkaar[]` (OR); they nest.
 * - Feathers: `Scene.fjaer: { x, y, w, h }` (percent, keep it small, about 3).
 *   One per scene at most. SE or a bare tap picks it up. `Kapittel.fjaerBelonning`
 *   is appended when the last one in the chapter is found. MENY shows «Fjær x/N».
 * - Mini-puzzles: `Kapittel.puslespill: { [id]: PuslespillDef }` and
 *   `Hotspot.puslespill: id`. BRUK opens it until solved; solving sets `flagg`
 *   and shows `tekst`; after that the hotspot's normal `bruk` line applies.
 *   Every def has `tittel`, `flagg`, `tekst` and one of (minispill.ts):
 *     { type: "laas", hjul: [["1","2","3"], ["A","B"]], svar: ["3","B"] }
 *     { type: "skyv", bilde?: "spill/x.jpg", trekk?: 40 }  (3×3, always solvable)
 *     { type: "radio", min: 88, max: 108, maal: 101.5, toleranse: 0.3, steg?: 0.1, enhet?: "MHz" }
 *     { type: "rute", rutenett: ["SL.", ".|.", ".LM"], start?: [quarter turns per cell] }
 *       S start, M goal, | straight, L corner, T tee, + cross, . empty.
 *   TIPS: add a `Gaate` with `ferdig` = the puzzle's `flagg`; the overlay's TIPS
 *   button uses it. A test rejects unsolvable or pre-solved routes and bad locks.
 * - SNAKK on a thing: `Hotspot.prat` (a Linje). Hotspots without `bruk`/`prat` get
 *   a rotating generic line, so no tap is ever silent.
 * - Notebook (NOTAT): every `Gaate` has `maal`, one bokmål line without the answer.
 *   It shows when solved (crossed out) or when it is the first unsolved goal; goals
 *   that run in parallel get `kjent` (a condition, `{}` = from the start).
 */
import type { EventyrSave } from "@/lib/storage";
import type { PuslespillDef } from "./minispill";

export type Verb = "se" | "bruk" | "snakk";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Every given part must hold: `hvis` flag set, `uten` flag not set, every
 * condition in `alle`, at least one in `en_av`. Parts nest.
 */
export interface Vilkaar {
  hvis?: string;
  uten?: string;
  alle?: Vilkaar[];
  en_av?: Vilkaar[];
}

/** One string, or the first variant whose condition holds. */
export type Linje = string | ({ tekst: string } & Vilkaar)[];

export interface Gjenstand {
  id: string;
  navn: string;
  /** pixelarticons name (lib/icons.tsx). */
  ikon: string;
  se: string;
}

/** Using an inventory item on a hotspot. */
export interface Bruk extends Vilkaar {
  item: string;
  tekst: string;
  flagg?: string;
  gir?: string;
  forbruker?: boolean;
}

export interface Hotspot {
  id: string;
  navn: string;
  rect: Rect;
  /** What a bare tap does when no verb is chosen. */
  smart: Verb;
  vis?: Vilkaar;
  se: Linje;
  /** BRUK with empty hands (after a possible `ta`). */
  bruk?: Linje;
  /** BRUK with empty hands picks this up once (flag `tok_<item>`). */
  ta?: { item: string; tekst: string } & Vilkaar;
  bruker?: Bruk[];
  /** Custom lines for wrong items; others get a generic shrug. */
  feil?: Record<string, string>;
  snakk?: string;
  /** SNAKK on a thing that has no dialog; otherwise a rotating generic line. */
  prat?: Linje;
  /** BRUK walks to this scene (stairs, doors); exits also get a button. */
  gaaTil?: string;
  /** BRUK opens this mini-puzzle (key in `Kapittel.puslespill`) until it is solved. */
  puslespill?: string;
}

export interface Kombinasjon {
  a: string;
  b: string;
  gir: string;
  tekst: string;
}

export interface Valg extends Vilkaar {
  tekst: string;
  /** Only offered while holding this item. */
  harItem?: string;
  neste?: string;
  flagg?: string;
  tar?: string;
  gir?: string;
}

export interface Node {
  tekst: Linje;
  /** Rampenissen cuts in from the living room; shown in a second bubble. */
  rampenissen?: string;
  valg?: Valg[];
}

export interface Dialog {
  taler: string;
  /** Portrait key (spill/portrett-<key>.png). */
  portrett: string;
  start: string;
  noder: Record<string, Node>;
}

export interface Scene {
  id: string;
  navn: string;
  bilde: string;
  hotspots: Hotspot[];
  utganger: { til: string; navn: string }[];
  /** Optional hidden owl feather (small rect, percent like hotspots). */
  fjaer?: Rect;
}

export interface Gaate {
  id: string;
  /** Solved when this flag is set; the first unsolved one owns the TIPS button. */
  ferdig: string;
  tips: [string, string, string];
  /** Notebook line (bokmål, no spoilers). Shown when solved, when it is the first unsolved, or when `kjent` holds. */
  maal?: string;
  /** Extra condition for showing `maal` early (`{}` = from the start) for goals that run in parallel. */
  kjent?: Vilkaar;
}

export interface Kapittel {
  n: number;
  tittel: string;
  /** December day it unlocks. */
  dag: number;
  /** False while the chapter is an outline (TODO text). */
  klar: boolean;
  start: string;
  intro: string[];
  /** Flag that ends the chapter. */
  slutt: string;
  utro: string;
  scener: Scene[];
  gjenstander: Record<string, Gjenstand>;
  kombinasjoner: Kombinasjon[];
  dialoger: Record<string, Dialog>;
  gaater: Gaate[];
  /** Line shown when the last feather of the chapter is found. */
  fjaerBelonning?: string;
  puslespill?: Record<string, PuslespillDef>;
}

export interface Utfall {
  save: EventyrSave;
  tekst?: string;
  /** Open this dialog. */
  dialog?: string;
  /** Open this mini-puzzle. */
  puslespill?: string;
  lyd?: "click" | "success" | "error";
}

const SKULDERTREKK = [
  "Rampenissen: «Nei. Nei nei nei. Det der gir ikkje mening, ikkje engang for mæ.»",
  "Rampenissen: «Prøvd det i 2021. Det gikk ikkje bra. Spør ikkje.»",
  "Rampenissen: «Æ ser ka du tenke, men nei.»",
  "Rampenissen: «Kreativt! Feil, men kreativt.»",
];

/** BRUK on something with no `bruk` line; rotates per hotspot so repeats stay fresh. */
const INGENTING = [
  "Det skjer ingenting. Absolutt ingenting.",
  "Rampenissen: «Knerten dytte på det med nebbet. Ingenting. Ho prøve med den andre sida av nebbet. Like lite.»",
  "Rampenissen: «Nei, det der e bare te å se på. Æ veit, æ har òg prøvd å ta på alt.»",
  "Rampenissen: «Det sitt fast, eller så e det ikkje meint å flyttes på. Sannsynligvis begge dela.»",
  "Rampenissen: «Knerten ser på det. Det ser tilbake. Ingen av dem gir sæ. Vi går videre.»",
];

/** SNAKK on something with neither `snakk` nor `prat`. */
const SVARER_IKKE = [
  (n: string) => `${n} svarer ikke. Forståelig nok.`,
  (n: string) =>
    `Du sier «hallo» til ${n.toLowerCase()}. Det blir stille. Rampenissen: «Æ har snakka med verre. Æ har snakka med ei dørmatte i tre tima.»`,
  (n: string) =>
    `Knerten uler lavt mot ${n.toLowerCase()}. Rampenissen: «Ugler snakke ikkje med sånt. Dem har standard.»`,
  (n: string) => `${n} sier ingenting, men du får en følelse av å bli vurdert.`,
];

const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

export const has = (save: EventyrSave, flag: string) =>
  save.flags.includes(flag);

export function ok(v: Vilkaar | undefined, save: EventyrSave): boolean {
  if (!v) return true;
  if (v.hvis && !has(save, v.hvis)) return false;
  if (v.uten && has(save, v.uten)) return false;
  if (v.alle && !v.alle.every((x) => ok(x, save))) return false;
  if (v.en_av && !v.en_av.some((x) => ok(x, save))) return false;
  return true;
}

export function velg(linje: Linje, save: EventyrSave): string {
  if (typeof linje === "string") return linje;
  return linje.find((l) => ok(l, save))?.tekst ?? "";
}

export const medFlagg = (
  save: EventyrSave,
  ...flags: (string | undefined)[]
) => ({
  ...save,
  flags: [
    ...save.flags,
    ...flags.filter((f): f is string => !!f && !save.flags.includes(f)),
  ],
});

const utenItem = (save: EventyrSave, id?: string) =>
  id ? { ...save, inventory: save.inventory.filter((i) => i !== id) } : save;
const medItem = (save: EventyrSave, id?: string) =>
  id && !save.inventory.includes(id)
    ? { ...save, inventory: [...save.inventory, id] }
    : save;

/**
 * Fresh start of a chapter. Only other chapters' `k<m>_…` facts survive, so a
 * replay («SPILL IGJEN», dev «nullstill») clears this chapter's flags and hints.
 */
export function nyttKapittel(
  kap: Kapittel,
  forrige?: EventyrSave | null,
): EventyrSave {
  const egne = new Set(kap.gaater.map((g) => g.id));
  return {
    kapittel: kap.n,
    sceneId: kap.start,
    inventory: [],
    flags: (forrige?.flags ?? []).filter(
      (f) => /^k\d+_/.test(f) && !f.startsWith(`k${kap.n}_`),
    ),
    hints: Object.fromEntries(
      Object.entries(forrige?.hints ?? {}).filter(([id]) => !egne.has(id)),
    ),
    fjaer: forrige?.fjaer ?? [],
  };
}

const fjaerId = (kap: Kapittel, sceneId: string) => `${kap.n}:${sceneId}`;

export const harFjaer = (kap: Kapittel, save: EventyrSave, sceneId: string) =>
  (save.fjaer ?? []).includes(fjaerId(kap, sceneId));

/** [found, total] feathers in the chapter. */
export function fjaerTelling(
  kap: Kapittel,
  save: EventyrSave,
): [number, number] {
  const med = kap.scener.filter((s) => s.fjaer);
  return [med.filter((s) => harFjaer(kap, save, s.id)).length, med.length];
}

/** Tap on the scene's feather: SE (or a bare tap) picks it up. */
export function taFjaer(
  kap: Kapittel,
  save: EventyrSave,
  sceneId: string,
  verb: Verb | null,
): Utfall {
  if (verb && verb !== "se")
    return {
      save,
      tekst: "Noe lite og mykt. Se nærmere på det.",
      lyd: "click",
    };
  if (harFjaer(kap, save, sceneId)) return { save };
  const s = { ...save, fjaer: [...(save.fjaer ?? []), fjaerId(kap, sceneId)] };
  const [x, n] = fjaerTelling(kap, s);
  return {
    save: s,
    tekst:
      x === n && kap.fjaerBelonning
        ? `En uglefjær! Fjær ${x}/${n}. ${kap.fjaerBelonning}`
        : `En uglefjær! Fjær ${x}/${n}.`,
    lyd: "success",
  };
}

export const scene = (kap: Kapittel, save: EventyrSave): Scene =>
  kap.scener.find((s) => s.id === save.sceneId) ?? kap.scener[0];

export const synlige = (s: Scene, save: EventyrSave) =>
  s.hotspots.filter((h) => ok(h.vis, save));

export function gaa(save: EventyrSave, til: string): Utfall {
  return { save: { ...save, sceneId: til }, lyd: "click" };
}

/** A tap on a hotspot, with a chosen verb and/or an item in hand. */
export function trykk(
  kap: Kapittel,
  save: EventyrSave,
  h: Hotspot,
  verb: Verb | null,
  holder: string | null,
): Utfall {
  if (holder) {
    const b = h.bruker?.find((x) => x.item === holder && ok(x, save));
    if (b) {
      let s = medFlagg(save, b.flagg);
      if (b.forbruker) s = utenItem(s, holder);
      s = medItem(s, b.gir);
      return { save: s, tekst: b.tekst, lyd: "success" };
    }
    const navn = kap.gjenstander[holder]?.navn ?? holder;
    const i = (holder.length + h.id.length) % SKULDERTREKK.length;
    return {
      save,
      tekst:
        h.feil?.[holder] ??
        `${navn} på ${h.navn.toLowerCase()}? ${SKULDERTREKK[i]}`,
      lyd: "error",
    };
  }
  const v = verb ?? h.smart;
  if (v === "se") return { save, tekst: velg(h.se, save), lyd: "click" };
  if (v === "bruk") {
    if (h.gaaTil) return gaa(save, h.gaaTil);
    const p = h.puslespill && kap.puslespill?.[h.puslespill];
    if (p && !has(save, p.flagg))
      return { save, puslespill: h.puslespill, lyd: "click" };
    const t = h.ta;
    const tok = t ? `tok_${t.item}` : "";
    if (t && !has(save, tok) && ok(t, save)) {
      return {
        save: medItem(medFlagg(save, tok), t.item),
        tekst: t.tekst,
        lyd: "success",
      };
    }
    return {
      save,
      tekst: h.bruk
        ? velg(h.bruk, save)
        : INGENTING[hash(h.id) % INGENTING.length],
      lyd: "click",
    };
  }
  if (h.snakk) return { save, dialog: h.snakk, lyd: "click" };
  return {
    save,
    tekst: h.prat
      ? velg(h.prat, save)
      : SVARER_IKKE[hash(h.id) % SVARER_IKKE.length](h.navn),
    lyd: "click",
  };
}

/** Item on item in the inventory. */
export function kombiner(
  kap: Kapittel,
  save: EventyrSave,
  a: string,
  b: string,
): Utfall {
  const k = kap.kombinasjoner.find(
    (x) => (x.a === a && x.b === b) || (x.a === b && x.b === a),
  );
  if (!k) {
    return {
      save,
      tekst: `${kap.gjenstander[a].navn} og ${kap.gjenstander[b].navn.toLowerCase()}? ${SKULDERTREKK[(a.length + b.length) % SKULDERTREKK.length]}`,
      lyd: "error",
    };
  }
  return {
    save: medItem(utenItem(utenItem(save, a), b), k.gir),
    tekst: k.tekst,
    lyd: "success",
  };
}

export const valgSomVises = (n: Node, save: EventyrSave) =>
  (n.valg ?? []).filter(
    (v) => ok(v, save) && (!v.harItem || save.inventory.includes(v.harItem)),
  );

const spurtFlagg = (dialog: string, v: Valg) => `spurt:${dialog}:${v.tekst}`;

/** Choices that lead somewhere are remembered (greyed) until the chapter restarts. */
export const erSpurt = (save: EventyrSave, dialog: string, v: Valg) =>
  !!v.neste && has(save, spurtFlagg(dialog, v));

export function velgSvar(
  save: EventyrSave,
  v: Valg,
  dialog?: string,
): EventyrSave {
  const s = medFlagg(
    save,
    v.flagg,
    dialog && v.neste ? spurtFlagg(dialog, v) : undefined,
  );
  return medItem(utenItem(s, v.tar), v.gir);
}

/** The open puzzle's next hint; levels stick at 3 so the answer stays visible. */
export function tips(kap: Kapittel, save: EventyrSave): Utfall {
  const g = kap.gaater.find((x) => !has(save, x.ferdig));
  if (!g) {
    return {
      save,
      tekst: "Rampenissen: «Tips? Du e jo ferdig! Gå og spis en klementin.»",
    };
  }
  const nivaa = Math.min(save.hints?.[g.id] ?? 0, 2);
  return {
    save: { ...save, hints: { ...save.hints, [g.id]: nivaa + 1 } },
    tekst: g.tips[nivaa],
    lyd: "click",
  };
}

/** Notebook («Hva gjør vi nå?»): solved goals, the current one, and goals already known. */
/** End card and chapter list: feathers, hints used, and one line from Rampenissen. */
export function oppsummering(kap: Kapittel, save: EventyrSave) {
  const [x, n] = fjaerTelling(kap, save);
  const tips = kap.gaater.reduce(
    (sum, g) => sum + Math.min(save.hints?.[g.id] ?? 0, 3),
    0,
  );
  const deler = [
    n > 0 ? `Fjær ${x}/${n}` : "",
    tips === 0 ? "Ingen tips" : tips === 1 ? "1 tips" : `${tips} tips`,
  ].filter(Boolean);
  return {
    fjaer: [x, n] as const,
    tips,
    kort: deler.join(" · "),
    linje:
      tips === 0
        ? "Rampenissen: «Null tips. Dokker e skumle gode. Æ fikk ikkje hviska en gang.»"
        : tips <= 3
          ? "Rampenissen: «Nesten heilt uten hjelp. Æ hviska litt, det teller ikkje.»"
          : "Rampenissen: «Æ hviska en del. Det e lov. Det e det æ e her for.»",
  };
}

export function notater(
  kap: Kapittel,
  save: EventyrSave,
): { tekst: string; gjort: boolean }[] {
  const naa = kap.gaater.findIndex((g) => !has(save, g.ferdig));
  return kap.gaater.flatMap((g, i) => {
    if (!g.maal) return [];
    const gjort = has(save, g.ferdig);
    if (!gjort && i !== naa && !(g.kjent && ok(g.kjent, save))) return [];
    return [{ tekst: g.maal, gjort }];
  });
}

/** The UI reports a solved mini-puzzle; the engine sets its flag. */
export function losPuslespill(
  kap: Kapittel,
  save: EventyrSave,
  id: string,
): Utfall {
  const p = kap.puslespill?.[id];
  if (!p) return { save };
  return { save: medFlagg(save, p.flagg), tekst: p.tekst, lyd: "success" };
}

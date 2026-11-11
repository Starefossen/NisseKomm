/**
 * Everything that unlocks during December, derived from each game's own data
 * (quest reveals, Ugleposten chapters, sleigh stages, TEKNISK HUD toys).
 * Drives sidebar alerts, the home-screen NY badge, calendar markers and the
 * in-game «NYTT I DAG» banner. Names are visible from their day, so they fall
 * under kodelekkasje.test.ts like everything else.
 *
 * Voices: Rampenissen speaks nordlandsk (Bodø/Salten, rules in
 * docs/manus/rampenissen-radio-2026.md), IQ plain bokmål with a technical bent.
 */
import { getAllQuests } from "./data-loader";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";
import { ETAPPER } from "@/components/windows/snofall-tv/slede";
import { GAMES } from "@/components/windows/snofall-tv/hud";

/** Desktop window that holds the unlock (page.tsx window ids). */
export type OpplasingVindu =
  | "nissekrypto"
  | "symbolskanner"
  | "nissespill"
  | "sledeflukt"
  | "nissemusikk"
  | "brevfugler"
  | "nissestats"
  | "nordpol_tv";

export interface Opplasing {
  dag: number;
  vindu: OpplasingVindu;
  /** Short line for banners and the calendar modal. */
  tekst: string;
  /** Noun phrase the nudge lines slot in («kapittel 2 i UGLEPOSTEN»). */
  navn: string;
  /** Sidebar alert in a character voice; unset for desktop modules, whose tile already says it. */
  varsel?: string;
  /** Only visible once that day's code is in (HUD toys). */
  etterKode?: boolean;
}

const MODULER: Record<string, [OpplasingVindu, string]> = {
  NISSEKRYPTO: ["nissekrypto", "NISSEKRYPTO"],
  SYMBOLSKANNER: ["symbolskanner", "SYMBOLSKANNER"],
  NISSESPILL: ["nissespill", "UGLEPOSTEN"],
  SLEDEFLUKT: ["sledeflukt", "SLEDEFLUKT"],
  NISSEMUSIKK: ["nissemusikk", "NISSEMUSIKK"],
  BREVFUGLER: ["brevfugler", "BREVFUGLER"],
  NISSESTATS: ["nissestats", "NISSESTATS"],
};

// Tails rotate so repeated alerts don't read as copies. No digits (number codes) and no code words.
const UGLE_HALE = [
  "Æ har pussa brillan te Floke. Med genseren. Ikkje sei det te Winter.",
  "Floke har fått nye batteri. Altså, æ fant dem i ei skuff hos IQ.",
  "Floke e lada. Æ e lada. Kaffen te IQ e sterk.",
  "Siste kapittel. Æ e ikkje nervøs. Det e brillan te Floke som dogge.",
];
const SLEDE_HALE = [
  "Kalibrert og testet. Av Pil. Han lever.",
  "Reinsdyrene er informert. De virket uinteresserte.",
  "Jeg har ikke fløyet den selv. Det er det dere er til.",
  "Sikkerhetsmargin: tilstrekkelig. Omtrent.",
];
const HUD_HALE = [
  "Ren lek, null nytte. Mitt favorittfelt.",
  "Winter kaller det sløsing. Jeg kaller det forskning.",
  "Jeg satt oppe hele natten. Det var verdt det.",
];
const rull = (liste: string[], i: number) => liste[i % liste.length];
const tall = ["To", "Tre", "Fire", "Fem"];

function bygg(): Opplasing[] {
  const moduler: Opplasing[] = getAllQuests().flatMap((q) =>
    (q.reveals?.modules ?? []).map((m) => {
      const [vindu, navn] = MODULER[m];
      return { dag: q.dag, vindu, tekst: `${navn} er åpen`, navn };
    }),
  );
  const inni: Opplasing[] = [
    ...KAPITLER.map((k, i) => ({
      dag: k.dag,
      vindu: "nissespill" as const,
      tekst: `Kapittel ${k.n} i UGLEPOSTEN er åpent`,
      navn: `kapittel ${k.n} i UGLEPOSTEN`,
      varsel: `RAMPENISSEN: Kapittel ${k.n} i UGLEPOSTEN e klart: «${k.tittel}». ${rull(UGLE_HALE, i)}`,
    })),
    ...ETAPPER.map((e, i) => ({
      dag: e.dag,
      vindu: "sledeflukt" as const,
      tekst: `Ny etappe i SLEDEFLUKT: ${e.navn}`,
      navn: `etappen ${e.navn} i SLEDEFLUKT`,
      varsel: `IQ: Ny etappe i SLEDEFLUKT: ${e.navn}. ${rull(SLEDE_HALE, i)}`,
    })),
    // The HUD sleigh toy only points to SLEDEFLUKT now
    ...GAMES.filter(([id]) => id !== "slede").map(([, navn, dag], i) => ({
      dag,
      vindu: "nordpol_tv" as const,
      tekst: `Nytt i TEKNISK HUD: ${navn}`,
      navn: `${navn} i TEKNISK HUD`,
      varsel: `IQ: TEKNISK HUD på Snøfall TV har fått ${navn}. ${rull(HUD_HALE, i)}`,
      etterKode: true,
    })),
  ];
  // The first chapter or stage opens with its module; the module line says it
  const aapnet = new Set(moduler.map((m) => `${m.vindu}:${m.dag}`));
  const alle = [
    ...moduler,
    ...inni.filter((o) => !aapnet.has(`${o.vindu}:${o.dag}`)),
  ].sort((a, b) => a.dag - b.dag);

  // A day that opens three things gets one line instead of three, after the
  // code since a HUD toy may be among them (day 16: NISSESTATS, chapter 3, Sorterer)
  for (const dag of new Set(alle.map((o) => o.dag))) {
    const dagens = alle.filter((o) => o.dag === dag);
    if (dagens.length < 3) continue;
    const navn = dagens.map((o) => o.navn);
    const liste = `${navn.slice(0, -1).join(", ")} og ${navn.at(-1)}`;
    dagens.forEach((o) => delete o.varsel);
    const baerer = dagens.find((o) => o.etterKode) ?? dagens[dagens.length - 1];
    baerer.varsel = `RAMPENISSEN: ${tall[dagens.length - 2] ?? dagens.length} ting på én dag: ${liste}. IQ sei det e tilfeldig. Æ trur han har drukke for mye kaffe.`;
    baerer.etterKode = true;
  }
  return alle;
}

export const OPPLASINGER: readonly Opplasing[] = bygg();

export const opplasingerPaaDag = (dag: number) =>
  OPPLASINGER.filter((o) => o.dag === dag);

/**
 * Nudge level for one unopened unlock (0 = quiet). Escalates while unopened,
 * at most one sidebar line per day, and nothing louder than the badge until
 * today's code is in, so the daily riddle comes first:
 * 1 badge (+ the unlock alert on its day), 2 Rampenissen asks (unlock day,
 * after the code), 3 tile glow and IQ teaser (next two days), 4 last nudge
 * (day 3), then quiet.
 */
export type Nivaa = 0 | 1 | 2 | 3 | 4;

export function nivaa(
  o: Opplasing,
  dag: number,
  kodeLost: boolean,
  sett: boolean,
): Nivaa {
  const alder = dag - o.dag;
  if (sett || alder < 0 || alder > 3) return 0;
  if (o.etterKode && alder === 0 && !kodeLost) return 0;
  if (!kodeLost) return 1;
  return alder === 0 ? 2 : alder === 3 ? 4 : 3;
}

export const settNokkel = (o: Opplasing) => `ny-${o.vindu}-${o.dag}` as const;

// {} is the unlock's navn; never first in the sentence, since navn may start lowercase
const PUFF: Record<2 | 3 | 4, string[]> = {
  2: [
    "RAMPENISSEN: Psst. No e {} på plass. Æ har ikkje tjuvtitta. Mye.",
    "RAMPENISSEN: Har dokker sett {}? Æ sitt her i hylla og trippe.",
    "RAMPENISSEN: Bra jobba med koden. No kan dokker kikke på {}. Æ sei ikkje meir.",
    "RAMPENISSEN: No vente {} på dokker. Æ har venta heile dagen, det e verre.",
  ],
  3: [
    "IQ: Logg: {} er åpnet. Besøk: null. Statistisk påfallende.",
    "IQ: Sensorene melder null aktivitet i {}. Jeg har sjekket sensorene. Det er dere.",
    "IQ: Winter spør om {} er «i bruk». Jeg har ikke svart ennå.",
    "IQ: Påminnelse, automatisk, men jeg mener det: {} står klar.",
  ],
  4: [
    "RAMPENISSEN: Siste gang æ mase om {}. Sannsynligvis. Æ lyg litt av og til.",
    "RAMPENISSEN: Okei, {}. Æ sei det ikkje fleire ganga. Julius sei æ mase. Han har rett.",
    "RAMPENISSEN: Så ligg {} der ennå. Æ gir mæ no. Nesten.",
    "RAMPENISSEN: Tre daga og null besøk i {}. IQ har laga et diagram. Det e trist å se på.",
  ],
};

/** Sidebar line for nudge level 2–4; none for 0–1. Variant depends on item and day, so two nudges rarely match. */
export function puffTekst(o: Opplasing, n: Nivaa, dag = o.dag): string | null {
  if (n !== 2 && n !== 3 && n !== 4) return null;
  const frø = [...o.navn].reduce((s, c) => s + c.charCodeAt(0), dag);
  return rull(PUFF[n], frø).replace("{}", o.navn);
}

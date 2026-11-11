/**
 * Everything that unlocks during December, derived from each game's own data
 * (quest reveals, Ugleposten chapters, sleigh stages, TEKNISK HUD toys).
 * Drives sidebar alerts, the home-screen NY badge, calendar markers and the
 * in-game «NYTT I DAG» banner. Names are visible from their day, so they fall
 * under kodelekkasje.test.ts like everything else.
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
  /** Sidebar alert in a character voice; unset for desktop modules, whose tile and daily_alerts already say it. */
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

function bygg(): Opplasing[] {
  const moduler: Opplasing[] = getAllQuests().flatMap((q) =>
    (q.reveals?.modules ?? []).map((m) => {
      const [vindu, navn] = MODULER[m];
      return { dag: q.dag, vindu, tekst: `${navn} er åpen` };
    }),
  );
  const inni: Opplasing[] = [
    ...KAPITLER.map((k) => ({
      dag: k.dag,
      vindu: "nissespill" as const,
      tekst: `Kapittel ${k.n}: «${k.tittel}»`,
      varsel: `UGLEPOSTEN: Kapittel ${k.n} er åpent. «${k.tittel}»`,
    })),
    ...ETAPPER.map((e) => ({
      dag: e.dag,
      vindu: "sledeflukt" as const,
      tekst: `Ny etappe: ${e.navn}`,
      varsel: `IQ: Ny etappe i SLEDEFLUKT: ${e.navn}.`,
    })),
    // The HUD sleigh toy only points to SLEDEFLUKT now
    ...GAMES.filter(([id]) => id !== "slede").map(([, navn, dag]) => ({
      dag,
      vindu: "nordpol_tv" as const,
      tekst: `Nytt i TEKNISK HUD: ${navn}`,
      varsel: `IQ: Nytt leketøy i TEKNISK HUD på Snøfall TV: ${navn}.`,
      etterKode: true,
    })),
  ];
  // The first chapter or stage opens with its module; the module line says it
  const aapnet = new Set(moduler.map((m) => `${m.vindu}:${m.dag}`));
  return [
    ...moduler,
    ...inni.filter((o) => !aapnet.has(`${o.vindu}:${o.dag}`)),
  ].sort((a, b) => a.dag - b.dag);
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

const NAVN: Record<OpplasingVindu, string> = {
  nissekrypto: "NISSEKRYPTO",
  symbolskanner: "SYMBOLSKANNER",
  nissespill: "UGLEPOSTEN",
  sledeflukt: "SLEDEFLUKT",
  nissemusikk: "NISSEMUSIKK",
  brevfugler: "BREVFUGLER",
  nissestats: "NISSESTATS",
  nordpol_tv: "SNØFALL TV",
};

/** Sidebar line for nudge level 2–4; none for 0–1. */
export function puffTekst(o: Opplasing, n: Nivaa): string | null {
  const navn = NAVN[o.vindu];
  if (n === 2)
    return `RAMPENISSEN: Har dokker sett det nye i ${navn}? ${o.tekst}.`;
  if (n === 3)
    return `IQ: ${o.tekst} venter fortsatt i ${navn}. Jeg har prøvd selv!`;
  if (n === 4)
    return `RAMPENISSEN: Æ sie det bare én gang te: ${o.tekst} i ${navn}.`;
  return null;
}

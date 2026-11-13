import type { MediaVurderinger } from "@/app/api/media/vurdering/route";
import {
  MERKE,
  versionRank,
  versionKey,
  celleAv,
  celleFor,
  forrigeTekst,
  type Celle,
  type StatusKilde,
} from "@/lib/media-status";
import type { Sesong } from "../_kveld/felles";
import { juliusFiles } from "../media/oversikt";
import { slug } from "../vurdering";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";
import { ETAPPER } from "@/components/windows/snofall-tv/slede";

/**
 * Everything Hans reviews in Gjennomgang, with the same ids the rest of the
 * guide and `mise run vurderinger` use. A media path is its own id.
 */
export const KOLONNER = [
  ["rampestrek", "Rampestrek"],
  ["gaate", "Gåte"],
  ["julius", "Julius"],
  ["radio", "Radio"],
  ["tekster", "Tekster"],
  ["utskrifter", "Utskrifter"],
  ["oppsett", "Oppsett"],
] as const;
export type Kolonne = (typeof KOLONNER)[number][0];

export interface Element {
  id: string;
  /** Column for day cells, section name for the rows outside the days. */
  gruppe: string;
  tittel: string;
  dag?: number;
  /** Files that must exist; one missing marks the cell «mangler». */
  media: string[];
  /** Older versions of the same file, newest first. */
  eldre?: string[];
}

/** `<stamme>-vN.mp4` with the highest N, else `<stamme>.mp4`. */
export function nyesteVersjon(
  stamme: string,
  filer: { path: string }[] | null,
) {
  const v = (p: string) => Number(p.match(/-v(\d+)\.mp4$/)?.[1] ?? 0);
  return (
    (filer ?? [])
      .map((f) => f.path)
      .filter((p) => p === `${stamme}.mp4` || p.startsWith(`${stamme}-v`))
      .sort((a, b) => v(b) - v(a))[0] ?? `${stamme}.mp4`
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** One cell, or null when the day has nothing in that column (no prints). */
export function dagElement(
  kol: Kolonne,
  n: number,
  sesong: Sesong,
  filer: { path: string; size: number | null }[] | null,
): Element | null {
  const dd = pad(n);
  const e = (id: string, media: string[] = []): Element => ({
    id,
    gruppe: kol,
    tittel: `Dag ${n}: ${KOLONNER.find(([k]) => k === kol)![1]}`,
    dag: n,
    media,
  });
  switch (kol) {
    case "rampestrek":
      return {
        ...e(`dag/${dd}/rampestrek`, [`strek/dag${dd}.png`]),
        eldre: (filer ?? [])
          .map((f) => f.path)
          .filter(
            (p) =>
              p !== `strek/dag${dd}.png` &&
              versionKey(p) === `strek/dag${dd}.png`,
          )
          .sort((a, b) => versionRank(b) - versionRank(a)),
      };
    case "gaate":
      return e(`dag/${dd}/gaatekart`);
    case "julius": {
      const [fil, ...eldre] = juliusFiles(n, filer);
      return { ...e(fil, [fil]), eldre };
    }
    case "radio": {
      const fil = `audio/rampenissen/dag-${dd}.mp3`;
      return e(fil, [fil]);
    }
    case "tekster":
      return e(`dag/${dd}/tekster`);
    case "utskrifter":
      return sesong.dager[n - 1]?.utskrifter.length
        ? e(`dag/${dd}/utskrifter`)
        : null;
    case "oppsett":
      return e(`dag/${dd}/kveld`);
  }
}

/** A Julius script day is judged per segment (#sK, the gate julius-dag.py reads), never as a whole. */
export const egenVurdering = (id: string) =>
  !/^manus\/julius\/dag-\d+$/.test(id);

/** Sections below the matrix, in display order. */
export function ekstraRader(
  sesong: Sesong,
  filer: { path: string }[] | null,
  krypto: number,
): Element[] {
  const r = (
    gruppe: string,
    id: string,
    tittel: string,
    media: string[] = [],
  ) => ({ id, gruppe, tittel, media }) as Element;
  return [
    ...Array.from({ length: 24 }, (_, i) =>
      r("Julius-manus", `manus/julius/dag-${pad(i + 1)}`, `Manus dag ${i + 1}`),
    ),
    ...Array.from({ length: 24 }, (_, i) =>
      r(
        "Radio-manus",
        `manus/radio/dag-${pad(i + 1)}`,
        `Radiomanus dag ${i + 1}`,
      ),
    ),
    ...KAPITLER.map((k) =>
      r("Ugleposten", `ugleposten/k${k.n}`, `Kapittel ${k.n}: ${k.tittel}`),
    ),
    ...ETAPPER.map((e, i) =>
      r("Sledeflukt", `sledeflukt/${e.id}`, `Etappe ${i + 1}: ${e.navn}`),
    ),
    r("Sledeflukt", "sledeflukt/fri", "Fri flyging"),
    ...(filer ?? [])
      .map((f) => f.path)
      .filter((p) => /^video\/tv\/.*\.mp4$/.test(p))
      .sort()
      .map((p) => r("Snøfall TV", p, p.slice(9), [p])),
    r("Finale", "finale", "Dag 24: snill liste og diplom"),
    r("Symboler og krypto", "symboler", "Symbolkortene"),
    ...Array.from({ length: krypto }, (_, i) =>
      r("Symboler og krypto", `krypto/${i + 1}`, `NisseKrypto ${i + 1}`),
    ),
    ...sesong.for.radio.map((x) =>
      r(
        "Før sesongen",
        `forsesong/${x.dato}`,
        `Morgenrådet ${Number(x.dato.slice(8))}. november`,
      ),
    ),
    r("Før sesongen", "forsesong/byggeplan", "Byggeplan dag 1"),
    r("Før sesongen", "forsesong/handleliste", "Handleliste"),
    ...sesong.historien.map((h) =>
      r("Historien", `historien/${slug(h.tittel)}`, h.tittel),
    ),
    ...(["A", "B"] as const).map((x) => {
      const fil = nyesteVersjon(`promo/julius-promo-${x}`, filer);
      return r(
        "Promo",
        fil,
        `Promo ${x}: ${x === "A" ? "til de voksne" : "teaser"}`,
        [fil],
      );
    }),
    ...filRader(filer),
  ];
}

/** A file's own section in Gjennomgang, by path; the grid groups come first. */
export const FILGRUPPER: [RegExp, string][] = [
  [/^spill\/piksel\/ikon\//, "Ikoner"],
  [/^spill\/piksel\/figur\//, "Figurer"],
  [/^spill\/piksel\//, "Pikselscener"],
  [/^spill\/portrett-/, "Portretter"],
  [/^spill\//, "Spillbilder"],
  [/^feed\//, "Stillbilder"],
  [/^music\//, "Musikk"],
  [/^retro\//, "Retro"],
];
/** Groups shown as a thumbnail grid with batch verdicts. */
export const RUTENETT = new Set([
  "Ikoner",
  "Figurer",
  "Pikselscener",
  "Portretter",
]);

/** Families the day columns, TV and promo already hold. */
const dekket = (key: string) =>
  /^(video\/julius\/dag-\d+\.mp4|audio\/rampenissen\/dag-\d+\.mp3|strek\/dag\d+\.png|video\/tv\/.*\.mp4|promo\/julius-promo-[AB]\.mp4)$/.test(
    key,
  );

/**
 * Every other media file, one element per version family: the id is the
 * newest version (the candidate to judge), the rest are `eldre`.
 */
export function filRader(filer: { path: string }[] | null): Element[] {
  const fam = new Map<string, string[]>();
  for (const { path: p } of filer ?? []) {
    const key = versionKey(p);
    if (p.startsWith("_arkiv/") || dekket(key)) continue;
    fam.set(key, [...(fam.get(key) ?? []), p]);
  }
  return [...fam]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, ps]) => {
      const [id, ...eldre] = ps.sort((a, b) => versionRank(b) - versionRank(a));
      const gruppe =
        FILGRUPPER.find(([r]) => r.test(key))?.[1] ??
        `Andre: ${key.split("/")[0]}`;
      return {
        id,
        gruppe,
        tittel: key.split("/").pop()!,
        media: [id],
        eldre,
      };
    });
}

/** Every element: by day (day 1 all columns, day 2 …) or by column; extras last. */
export function alleElementer(
  rekkefolge: "dag" | "kolonne",
  sesong: Sesong,
  filer: { path: string; size: number | null }[] | null,
  krypto: number,
): Element[] {
  const dager = Array.from({ length: 24 }, (_, i) => i + 1);
  const celler =
    rekkefolge === "dag"
      ? dager.flatMap((n) =>
          KOLONNER.map(([k]) => dagElement(k, n, sesong, filer)),
        )
      : KOLONNER.flatMap(([k]) =>
          dager.map((n) => dagElement(k, n, sesong, filer)),
        );
  return [
    ...celler.filter((e): e is Element => e !== null),
    ...ekstraRader(sesong, filer, krypto),
  ];
}

export type Tilstand = Celle;

/** The cell for an element: media through media-status (the file in use, «→ vN»), the rest by verdict. */
export function tilstand(
  e: Element,
  k: StatusKilde,
): { celle: Celle; tekst: string; notat?: string } {
  if (e.media.length) {
    const { celle, familie } = celleFor(e.media, k);
    return { celle, tekst: familie!.tekst, notat: familie!.iBruk.notat };
  }
  const v = k.vurderinger[e.id];
  // Old entries hold «Lag på nytt» as display text.
  const celle = celleAv(v);
  return { celle, tekst: MERKE[celle][0], notat: v?.notat ?? forrigeTekst(v) };
}

/** Next element after `id` without a verdict, wrapping around. */
export function nesteUvurdert(
  liste: Element[],
  id: string,
  vurd: MediaVurderinger,
): Element | undefined {
  const i = liste.findIndex((e) => e.id === id);
  const rundt = [...liste.slice(i + 1), ...liste.slice(0, i + 1)];
  return rundt.find((e) => e.id !== id && !vurd[e.id]?.vurdering);
}

/** The item `steg` places from `id` in `liste` (+1 next, -1 previous), wrapping at the ends. */
export function naboI(
  liste: Element[],
  id: string,
  steg: 1 | -1,
): { e?: Element; rundt: boolean } {
  const i = liste.findIndex((e) => e.id === id);
  if (i < 0 || liste.length < 2) return { rundt: false };
  const j = (i + steg + liste.length) % liste.length;
  return { e: liste[j], rundt: steg === 1 ? j < i : j > i };
}

/**
 * N/] and P/[ from one order, so they are always inverses: the queue's ids
 * (`ko`, from «Venter på deg») when given, else the filtered list. Under «Alt»
 * the caller passes no queue.
 */
export function naboer(
  filtrert: Element[],
  alle: Element[],
  id: string,
  ko: string[] | null,
) {
  const finn = (x?: string) => (x ? alle.find((e) => e.id === x) : undefined);
  const i = ko ? ko.indexOf(id) : -1;
  const nesteKo = finn(
    ko ? (i >= 0 ? ko[i + 1] : ko.find((x) => x !== id)) : undefined,
  );
  const nabo = naboI(filtrert, id, 1);
  return {
    neste: nesteKo ?? nabo.e,
    forrige:
      (ko && i > 0 ? finn(ko[i - 1]) : undefined) ?? naboI(filtrert, id, -1).e,
    iKo: !!nesteKo,
    rundt: !nesteKo && nabo.rundt,
  };
}

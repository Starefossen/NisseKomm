/**
 * The one status computation for a media file and its versions. The media page,
 * Gjennomgang, the day view, the library and `mise run vurderinger` all read it.
 *
 * Version convention (also assets/bin/medie.py, VERSION): the plain name is the
 * file in use (what the kids' app plays), <name>-vN.<ext> a newer candidate,
 * <name>.old-N.<ext> a replaced or rejected one.
 *
 * Cell rule: the state of the version IN USE, plus «→ vN <mark>» when a newer
 * candidate exists. «○ → v4 ✓» = the file in use is not reviewed, v4 is approved.
 */

export type Celle =
  | "godkjent"
  | "ok"
  | "ikke_vurdert"
  | "ny_versjon"
  | "lag_paa_nytt"
  | "utdatert"
  | "mangler"
  | "valgfri";

/** Mark, colour class, name. */
export const MERKE: Record<Celle, [string, string, string]> = {
  godkjent: ["✓", "text-(--gold)", "godkjent"],
  ok: ["◐", "text-amber-300", "OK"],
  ikke_vurdert: ["○", "text-(--neon-green)/70", "ikke vurdert"],
  ny_versjon: ["○", "text-(--neon-green)/70", "ny versjon, ikke vurdert"],
  lag_paa_nytt: ["↻", "text-amber-400", "lag på nytt"],
  utdatert: ["!", "text-(--cold-blue)", "utdatert"],
  mangler: ["✗", "text-(--christmas-red)", "mangler"],
  valgfri: ["○", "text-(--gray)", "valgfri – ikke laget"],
};

export const FORKLARING =
  "Merket er gjeldende versjon (navnet uten -vN). «→ v4 ✓» betyr at en nyere versjon finnes, med sin egen status; den tas i bruk med knappen «Ta i bruk v4».";

// Worst first: a cell over several files shows the one that needs attention most.
export const VERST: Celle[] = [
  "mangler",
  "lag_paa_nytt",
  "utdatert",
  "ny_versjon",
  "ikke_vurdert",
  "valgfri",
  "ok",
  "godkjent",
];

/** Approved or OK: both may ship and count as done. */
export const brukbar = (c?: Celle) => c === "godkjent" || c === "ok";
export const verst = (c: Celle[]) =>
  VERST.find((v) => c.includes(v)) ?? "godkjent";

export const versionKey = (path: string) =>
  path.replace(/(?:-v\d+|\.old-\d+)(\.\w+)$/, "$1");

export const variantOf = (path: string) =>
  Number(path.match(/-v(\d+)\.\w+$/)?.[1] ?? 0);

/** .old-N oldest (higher N newer), the plain name next, then -vN by N. */
const versionRank = (path: string) => {
  const old = path.match(/\.old-(\d+)\.\w+$/);
  if (old) return -1 / (1 + Number(old[1]));
  return path === versionKey(path) ? 0.5 : variantOf(path);
};

/** «gjeldende versjon», «v2», «gammel 1». */
export const versjonsnavn = (path: string) =>
  path === versionKey(path)
    ? "gjeldende versjon"
    : (path.match(/-(v\d+)\.\w+$/)?.[1] ??
      path.replace(/.*\.old-(\d+)\.\w+$/, "gammel $1"));

export interface StatusKilde {
  filer: { path: string; size: number | null; fraVersjon?: number }[];
  /** As served by /api/media/vurdering: `forrige` = verdict on an earlier version. */
  vurderinger: Record<
    string,
    {
      vurdering?: string;
      notat?: string;
      forrige?: { vurdering?: string; notat?: string };
    }
  >;
  /** Inventory status per path (media-inventar.json). */
  inventar?: Map<string, { status: string }>;
}

export interface Versjon {
  path: string;
  navn: string;
  celle: Celle;
  notat?: string;
}

/** Cell for a verdict alone (guide sections, and files that exist and are current). */
export const celleAv = (v?: {
  vurdering?: string;
  forrige?: unknown;
}): Celle =>
  v?.vurdering === "godkjent" || v?.vurdering === "ok"
    ? (v.vurdering as Celle)
    : v?.vurdering
      ? "lag_paa_nytt"
      : v?.forrige
        ? "ny_versjon"
        : "ikke_vurdert";

/** «forrige versjon: lag på nytt – "…"» for a verdict given to an older file or text. */
export function forrigeTekst(v?: {
  forrige?: { vurdering?: string; notat?: string };
}) {
  const f = v?.forrige;
  if (!f) return undefined;
  const hva =
    f.vurdering === "godkjent" || f.vurdering === "ok"
      ? f.vurdering
      : "lag på nytt";
  return `forrige versjon: ${hva}${f.notat ? ` – «${f.notat}»` : ""}`;
}

export interface Familie {
  /** The plain name: what the app plays. */
  key: string;
  iBruk: Versjon;
  /** The newest -vN, when one exists. */
  kandidat?: Versjon;
  /** Every version on disk, newest first (plain name included even when missing). */
  versjoner: Versjon[];
  /** The cell: the state of the version in use. */
  celle: Celle;
  /** «○», «○ → v4 ✓». */
  tekst: string;
  /** The candidate is approved and can replace the file in use. */
  kanTaIBruk: boolean;
}

export function versjon(path: string, k: StatusKilde): Versjon {
  const finnes = k.filer.some((f) => f.path === path && f.size !== null);
  const v = k.vurderinger[path];
  // Old entries hold «Lag på nytt» as display text: any other verdict is a rejection.
  const celle: Celle = !finnes
    ? k.inventar?.get(path)?.status === "valgfri"
      ? "valgfri"
      : "mangler"
    : v?.vurdering && celleAv(v) === "lag_paa_nytt"
      ? "lag_paa_nytt"
      : k.inventar?.get(path)?.status === "stale"
        ? "utdatert"
        : celleAv(v);
  return {
    path,
    navn: versjonsnavn(path),
    celle,
    notat: v?.notat ?? forrigeTekst(v),
  };
}

export function familie(path: string, k: StatusKilde): Familie {
  const key = versionKey(path);
  const paths = [
    ...new Set(
      [key, ...k.filer.map((f) => f.path)].filter((p) => versionKey(p) === key),
    ),
  ]
    .filter(
      (p) => p === key || k.filer.some((f) => f.path === p && f.size !== null),
    )
    .sort((a, b) => versionRank(b) - versionRank(a));
  const versjoner = paths.map((p) => versjon(p, k));
  const iBruk = versjoner.find((v) => v.path === key)!;
  // Only a -vK newer than the version in use is a candidate; older ones are history.
  const fra = k.filer.find((f) => f.path === key)?.fraVersjon ?? 0;
  const kandidat = versjoner.find((v) => variantOf(v.path) > fra);
  const tekst =
    MERKE[iBruk.celle][0] +
    (kandidat ? ` → ${kandidat.navn} ${MERKE[kandidat.celle][0]}` : "");
  return {
    key,
    iBruk,
    kandidat,
    versjoner,
    celle: iBruk.celle,
    tekst,
    kanTaIBruk: brukbar(kandidat?.celle),
  };
}

export interface VersionGroup<T> {
  key: string;
  newest: T;
  /** Everything but newest, newest first. */
  older: T[];
}

/** Items grouped by versionKey, in the order the keys first appear. */
export function groupVersions<T extends { path: string }>(
  items: T[],
): VersionGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const k = versionKey(it.path);
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  return [...groups].map(([key, list]) => {
    const [newest, ...older] = list.sort(
      (a, b) => versionRank(b.path) - versionRank(a.path),
    );
    return { key, newest, older };
  });
}

/** One cell over several files (a TV day with two loops): the worst family. */
export function celleFor(paths: string[], k: StatusKilde) {
  const fam = paths.map((p) => familie(p, k));
  const celle = verst(fam.map((f) => f.celle));
  return { celle, familie: fam.find((f) => f.celle === celle) };
}

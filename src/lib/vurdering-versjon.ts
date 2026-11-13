import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * A verdict belongs to one version of what was reviewed. Saving stamps
 * `versjon`; when the file or the baked text has changed since, the verdict
 * is served as `forrige` (history) and the item counts as not reviewed. The
 * stored verdict is never touched; the next save overwrites it.
 */
export interface Forrige {
  vurdering?: string;
  notat?: string;
  oppdatert?: string;
  /** Guide sections: lines removed (-) and added (+) since the verdict. */
  endringer?: Endring[];
  /** Media: the file was swapped (date, bytes before → after, the old file when kept). */
  fil?: { byttet: string; før?: number; etter: number; gammel?: string };
  /** Neither a snapshot nor an old version: «Endring ukjent», Behold forrige vurdering. */
  ukjent?: boolean;
}

export interface Endring {
  t: "+" | "-";
  l: string;
}

/** Changed lines only, from a plain LCS: section texts are a few dozen lines. */
export function linjeDiff(før: string, nå: string): Endring[] {
  const a = før.split("\n");
  const b = nå.split("\n");
  const L = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      L[i][j] =
        a[i] === b[j]
          ? L[i + 1][j + 1] + 1
          : Math.max(L[i + 1][j], L[i][j + 1]);
  const ut: Endring[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (j >= b.length || (i < a.length && L[i + 1][j] >= L[i][j + 1]))
      ut.push({ t: "-", l: a[i++] });
    else ut.push({ t: "+", l: b[j++] });
  }
  return ut;
}

const kort = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex").slice(0, 12);

/** Version of any reviewed item from its content; same as medie.innholds_hash in python. */
export const innholdsHash = (innhold: unknown) => kort(JSON.stringify(innhold));

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9æøå§.]+/g, "-")
    .replace(/^-|-$/g, "");

const tekstAv = (x: unknown): string =>
  typeof x === "string"
    ? x
    : x && typeof x === "object"
      ? Object.values(x).map(tekstAv).filter(Boolean).join("\n")
      : "";

/**
 * The source text a guide-section verdict is given to (doc text from the
 * bake, never chips, links or other derived UI), or null for sections that
 * are code. Stored with the verdict, so a change shows as a diff.
 */
export async function seksjonsTekst(id: string): Promise<string | null> {
  // Lazy: guide-sesong pulls in the whole game; media-promote only needs files.
  const { forSesongen, gaatekartKilde, historien, kveldKilde } =
    await import("./guide-sesong");
  const [side, a, b] = id.split("/");
  if (side === "dag") {
    if (b === "gaatekart") return gaatekartKilde(Number(a)) || null;
    // ponytail: kveld, utskrifter and rampestrek share one day's source; split it if one flags the others too often.
    if (["kveld", "utskrifter", "rampestrek"].includes(b))
      return kveldKilde(Number(a)) || null;
    return null;
  }
  if (side === "historien") {
    const h = historien().find((h) => slug(h.tittel) === a);
    return h ? tekstAv(h) : null;
  }
  if (side === "forsesong") return tekstAv(forSesongen());
  return null;
}

/**
 * What hashing a non-file id means. Bump it whenever seksjonsTekst or
 * seksjonsInnhold changes what they cover: verdicts with a `tekst` snapshot
 * equal to today's text are then restamped (vurdering-lager `restemple`),
 * never shown as «ny versjon». 1 = the page object (before 13.11), 2 = source text.
 */
export const HASH_VERSJON = 2;

/** The text a verdict on a non-file id is given to (sections and scripts), stored as its snapshot. */
export async function øyeblikkTekst(id: string): Promise<string | null> {
  if (id.startsWith("manus/")) {
    const k = await seksjonsInnhold(id).catch(() => null);
    return k == null
      ? null
      : Array.isArray(k)
        ? k.map(String).join("\n")
        : String(k);
  }
  return seksjonsTekst(id).catch(() => null);
}

/** What a verdict on a non-file id is given to: a manus key or a section's source text. */
async function seksjonsInnhold(id: string): Promise<unknown> {
  // `manus/julius/dag-14#s3`: the take.json key julius-dag.py bakes (python manus).
  const seg = id.match(/^manus\/julius\/dag-(\d+)#s(\d+)$/);
  if (seg) {
    const { default: manus } = await import("@/data/julius-manus.json");
    return (
      (manus as Record<string, { s: number; key: unknown }[]>)[
        String(Number(seg[1]))
      ]?.find((x) => x.s === Number(seg[2]))?.key ?? null
    );
  }
  // `manus/radio/dag-05`: the text rampenissen-tts.sh speaks (python3 assets/bin/medie.py radio-manus).
  const radio = id.match(/^manus\/radio\/dag-(\d+)$/);
  if (radio) {
    const { default: r } = await import("@/data/radio-manus.json");
    return (
      (r as Record<string, { tekst: string }>)[String(Number(radio[1]))]
        ?.tekst ?? null
    );
  }
  return seksjonsTekst(id);
}

/** Segment s's raw hashes in every dag-NN*.segmenter.json under dir, newest join first. */
export async function segmentRaws(dir: string, dag: number, s: number) {
  const mappe = path.join(dir, "video/julius");
  const navn = await readdir(mappe).catch(() => [] as string[]);
  const filer = await Promise.all(
    navn
      .filter(
        (f) =>
          f.startsWith(`dag-${String(dag).padStart(2, "0")}`) &&
          f.endsWith(".segmenter.json"),
      )
      .map(async (f) => ({ f, t: (await stat(path.join(mappe, f))).mtimeMs })),
  );
  const ut: string[] = [];
  for (const { f } of filer.sort((a, b) => b.t - a.t)) {
    const segs = JSON.parse(await readFile(path.join(mappe, f), "utf8")) as {
      s: number;
      raw?: string | null;
    }[];
    const raw = segs.find((x) => x.s === s)?.raw;
    if (raw) ut.push(raw);
  }
  return ut;
}

/** Size and mtime for a media file, a hash of the baked text for a section, null when neither applies. */
export async function versjonAv(dir: string, id: string) {
  const info = await stat(path.join(dir, id)).catch(() => null);
  if (info?.isFile()) return `${info.size}-${Math.round(info.mtimeMs)}`;
  if (info) return null;
  // `video/julius/dag-14#s3`: the raw clip's bytes, as julius-dag.py's segment lock reads them.
  const klipp = id.match(/^video\/julius\/dag-(\d+)#s(\d+)$/);
  if (klipp) {
    const raw = path.join(
      process.cwd(),
      "assets/out",
      `dag${klipp[1]}-${klipp[2]}.raw.mp4`,
    );
    // Without assets/out (the lan pod): the raw hash the newest join recorded.
    return readFile(raw).then(
      kort,
      async () =>
        (await segmentRaws(dir, Number(klipp[1]), Number(klipp[2])))[0] ?? null,
    );
  }
  try {
    const innhold = await seksjonsInnhold(id);
    return innhold == null ? null : innholdsHash(innhold);
  } catch {
    return null;
  }
}

async function endret(
  dir: string,
  id: string,
  v: { versjon?: string; oppdatert?: string },
) {
  const nå = await versjonAv(dir, id);
  if (v.versjon) return nå !== null && nå !== v.versjon;
  // Verdicts from before the stamp: a sidecar written after the verdict.
  const meta = await readFile(path.join(dir, `${id}.meta.json`), "utf8")
    .then((t) => JSON.parse(t) as { created?: string })
    .catch(() => null);
  return (
    !!meta?.created &&
    !!v.oppdatert &&
    Date.parse(meta.created) > Date.parse(v.oppdatert)
  );
}

/** The verdict file as the guide sees it: changed items carry their old verdict as `forrige`. */
export async function medVersjon<
  T extends {
    vurdering?: string;
    notat?: string;
    oppdatert?: string;
    versjon?: string;
  },
>(dir: string, vurd: Record<string, T>) {
  const ut: Record<string, Partial<T> & { forrige?: Forrige }> = {};
  await Promise.all(
    Object.entries(vurd).map(async ([id, v]) => {
      ut[id] =
        v.vurdering && (await endret(dir, id, v))
          ? ({
              forrige: {
                vurdering: v.vurdering,
                notat: v.notat,
                oppdatert: v.oppdatert,
              },
              oppdatert: v.oppdatert,
            } as Partial<T> & { forrige: Forrige })
          : v;
    }),
  );
  return ut;
}

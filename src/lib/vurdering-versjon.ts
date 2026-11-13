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

/** The baked text behind a guide section, or null for sections that are code. */
async function seksjonsInnhold(id: string): Promise<unknown> {
  // Lazy: guide-sesong pulls in the whole game; media-promote only needs files.
  const { forSesongen, gaatekart, historien, kveldDag } =
    await import("./guide-sesong");
  const [side, a, b] = id.split("/");
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
  if (side === "dag") {
    if (b === "gaatekart") return gaatekart(Number(a));
    // ponytail: kveld, utskrifter and rampestrek share one day block; split it if one flags the others too often.
    if (["kveld", "utskrifter", "rampestrek"].includes(b))
      return kveldDag(Number(a));
    return null;
  }
  if (side === "historien")
    return historien().find((h) => slug(h.tittel) === a) ?? null;
  if (side === "forsesong") return forSesongen();
  return null;
}

/** Segment s's raw hash in the newest dag-NN*.segmenter.json under dir, or null. */
async function segmentRaw(dir: string, dag: number, s: number) {
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
  for (const { f } of filer.sort((a, b) => b.t - a.t)) {
    const segs = JSON.parse(await readFile(path.join(mappe, f), "utf8")) as {
      s: number;
      raw?: string | null;
    }[];
    const raw = segs.find((x) => x.s === s)?.raw;
    if (raw) return raw;
  }
  return null;
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
    return readFile(raw).then(kort, () =>
      segmentRaw(dir, Number(klipp[1]), Number(klipp[2])),
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

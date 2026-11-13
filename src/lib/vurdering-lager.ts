import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  appendFile,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import manus from "@/data/julius-manus.json";
import { variantOf, versionKey } from "./media-status";
import type { Kutt } from "./segmenter";
import {
  HASH_VERSJON,
  linjeDiff,
  medVersjon,
  versjonAv,
  øyeblikkTekst,
  type Forrige,
} from "./vurdering-versjon";

/**
 * MEDIA_DIR/media-vurdering.json, format 2 (design: review-ui-design.md §2).
 * One element per stable id (-vN/.old-N folded in); each verdict belongs to the
 * content hash it was given to and remembers the file (`fil`) it was given on.
 * Overwritten or removed verdicts go to `historikk`, never deleted.
 * Pages still get the old shape (`visning`); medie.py reads and writes the same file.
 */
export const FIL = "media-vurdering.json";
export const SESONG = 2026;

export interface Oppføring {
  vurdering?: string;
  notat?: string;
  oppdatert?: string;
  /** What was reviewed when it was saved: size-mtime for files, the section/segment hash otherwise. */
  versjon?: string;
  /** Quick tags (src/data/vurdering-tagger.json) and a timecode in seconds. */
  tagger?: string[];
  tid?: number;
  /** Julius segments: ✂ (with «kutt») and the cut julius-dag.py --kutt made, waiting for Hans' ear. */
  kutt?: Kutt;
  kuttsjekk?: Kutt;
  /** Sections and scripts: the text the verdict was given to, for the diff when it changes. */
  tekst?: string;
  /** Which definition of a non-file hash `hash` was made under (HASH_VERSJON); none = 1. */
  hashVersjon?: number;
  /** Why the verdict was moved, e.g. «gjenopprettet: hashdefinisjon endret». */
  merknad?: string;
}

/** `hash`: content hash; "*" = nothing to version (code, missing file), "utdatert" = changed before format 2. */
export interface Vurdering extends Oppføring {
  hash: string;
  fil: string;
}

export interface Element {
  vurderinger: Vurdering[];
  historikk: Vurdering[];
}

export interface Lager {
  format: 2;
  sesong: number;
  elementer: Record<string, Element>;
}

export type Flat = Record<string, Oppføring>;

const ALLTID = "*";
const UTDATERT = "utdatert";

const hashCache = new Map<string, Promise<string>>();
/** sha256 of the bytes, 12 hex; the same as kort() for raw clips and medie.fil_hash. */
export function filHash(full: string, stempel: string) {
  const k = `${full}|${stempel}`;
  if (!hashCache.has(k))
    hashCache.set(
      k,
      new Promise((ok, feil) => {
        const h = createHash("sha256");
        createReadStream(full)
          .on("data", (b) => h.update(b))
          .on("error", feil)
          .on("end", () => ok(h.digest("hex").slice(0, 12)));
      }),
    );
  return hashCache.get(k)!;
}

/** Stamp and content hash of what an id points at now; both null when there is nothing to version. */
async function nå(dir: string, id: string) {
  const full = path.join(dir, id);
  const info = await stat(full).catch(() => null);
  if (info?.isFile()) {
    const stempel = `${info.size}-${Math.round(info.mtimeMs)}`;
    return { stempel, hash: () => filHash(full, stempel) };
  }
  const v = info ? null : await versjonAv(dir, id);
  return { stempel: v, hash: async () => v };
}

/** Is the verdict still given to what the file holds now? */
export async function gjeldende(dir: string, v: Vurdering) {
  if (v.hash === ALLTID) return true;
  // A snapshot decides on its own: no change to how hashes are made can make it stale.
  if (v.tekst != null) {
    const t = await øyeblikkTekst(v.fil);
    if (t != null) return t === v.tekst;
  }
  if (v.hash === UTDATERT) return false;
  const n = await nå(dir, v.fil);
  if (n.stempel === null) return true;
  if (v.versjon && v.versjon === n.stempel) return true;
  return (await n.hash()) === v.hash;
}

/** «Lag på nytt» as display text (three old entries) becomes the verdict id; undefined fields go. */
const ren = <T extends Oppføring>(v: T): T => {
  const vurdering =
    v.vurdering === "Lag på nytt" ? "lag_paa_nytt" : v.vurdering;
  return Object.fromEntries(
    Object.entries({ ...v, vurdering }).filter(([, x]) => x !== undefined),
  ) as T;
};

/** A verdict as pages see it: without hash and file. */
export function oppføring(v: Vurdering): Oppføring {
  const o: Partial<Vurdering> = { ...v };
  delete o.hash;
  delete o.fil;
  delete o.tekst;
  return o;
}

/** The old shape for pages and list_vurderinger: changed items carry their verdict as `forrige`. */
export async function visning(dir: string, lager: Lager) {
  const ut: Record<string, Oppføring & { forrige?: Forrige }> = {};
  await Promise.all(
    Object.values(lager.elementer).flatMap((e) =>
      e.vurderinger.map(async (v) => {
        const o = oppføring(v);
        ut[v.fil] =
          o.vurdering && !(await gjeldende(dir, v))
            ? {
                forrige: {
                  vurdering: o.vurdering,
                  notat: o.notat,
                  oppdatert: o.oppdatert,
                  ...(await hvaEndret(dir, v)),
                },
                oppdatert: o.oppdatert,
              }
            : o;
      }),
    ),
  );
  return ut;
}

/**
 * What changed since a verdict that no longer counts: the text diff (sections,
 * scripts), the file swap (media: date, size before → after, the old file), or
 * `ukjent` when there is nothing to compare against.
 */
export async function hvaEndret(
  dir: string,
  v: Vurdering,
): Promise<Pick<Forrige, "endringer" | "fil" | "ukjent">> {
  if (v.tekst != null) {
    const t = await øyeblikkTekst(v.fil);
    if (t != null) return { endringer: linjeDiff(v.tekst, t) };
  }
  const full = path.join(dir, v.fil);
  const info = await stat(full).catch(() => null);
  if (info?.isFile()) {
    const før = v.versjon?.match(/^(\d+)-\d+$/);
    const ext = path.extname(v.fil);
    const stamme = path.basename(v.fil, ext);
    const gamle = (await readdir(path.dirname(full)).catch(() => []))
      .filter((f) => f.startsWith(`${stamme}.old-`) && f.endsWith(ext))
      .sort(
        (a, b) =>
          parseInt(b.slice(stamme.length + 5)) -
          parseInt(a.slice(stamme.length + 5)),
      );
    if (før || gamle.length)
      return {
        fil: {
          byttet: new Date(info.mtimeMs).toISOString(),
          etter: info.size,
          ...(før ? { før: Number(før[1]) } : {}),
          ...(gamle.length
            ? { gammel: path.posix.join(path.posix.dirname(v.fil), gamle[0]) }
            : {}),
        },
      };
  }
  return { ukjent: true };
}

/**
 * Restamp verdicts made under an older hash definition whose snapshot is still
 * today's text: the definition moved, the content did not. Pure over `l`, so
 * lesLager applies it on every read and the next write keeps it.
 */
export async function restemple(
  dir: string,
  l: Lager,
  def: {
    versjon: number;
    hash: (id: string) => Promise<string | null>;
  } = { versjon: HASH_VERSJON, hash: (id) => versjonAv(dir, id) },
) {
  const ut: string[] = [];
  for (const e of Object.values(l.elementer))
    for (const [i, v] of e.vurderinger.entries()) {
      if (v.tekst == null || (v.hashVersjon ?? 1) === def.versjon) continue;
      if ((await øyeblikkTekst(v.fil)) !== v.tekst) continue;
      const hash = await def.hash(v.fil);
      if (!hash) continue;
      e.historikk.push({
        ...v,
        merknad: "gjenopprettet: hashdefinisjon endret",
      });
      e.vurderinger[i] = {
        ...v,
        hash,
        versjon: hash,
        hashVersjon: def.versjon,
      };
      ut.push(v.fil);
    }
  return ut;
}

/** Stored verdicts by file, without the version check (medie.vurderinger() in python). */
export function flat(lager: Lager): Flat {
  return Object.fromEntries(
    Object.values(lager.elementer).flatMap((e) =>
      e.vurderinger.map((v) => [v.fil, oppføring(v)]),
    ),
  );
}

const telle = (l: Lager) =>
  Object.values(l.elementer).reduce(
    (n, e) => n + e.vurderinger.length + e.historikk.length,
    0,
  );

/** Format 1 → 2. Stays a pure function of the files: run twice, same result. */
export async function migrer(dir: string, gammel: Flat): Promise<Lager> {
  const lager: Lager = { format: 2, sesong: SESONG, elementer: {} };
  const før = await medVersjon(dir, gammel);
  for (const [fil, rå] of Object.entries(gammel)) {
    const v = ren(rå);
    const n = await nå(dir, fil);
    let hash: string;
    if (v.versjon) {
      // Changed since the verdict: keep the old stamp as hash, it never matches content.
      hash =
        n.stempel === v.versjon
          ? ((await n.hash()) ?? ALLTID)
          : n.stempel === null
            ? ALLTID
            : v.versjon;
    } else if (før[fil]?.forrige) {
      hash = UTDATERT;
    } else {
      // No stamp to add: the view would then differ from today's. Hashed once per process.
      hash = (await n.hash()) ?? ALLTID;
    }
    const e = (lager.elementer[versionKey(fil)] ??= {
      vurderinger: [],
      historikk: [],
    });
    e.vurderinger.push(ren({ ...v, hash, fil }));
  }
  // The check that follows the migration: every verdict kept, every cell the same.
  if (telle(lager) !== Object.keys(gammel).length)
    throw new Error("migrering: antall vurderinger inn ≠ ut");
  // As served (JSON): undefined fields do not count.
  const json = (x: unknown) => JSON.parse(JSON.stringify(x));
  const forventet = Object.fromEntries(
    Object.entries(json(før) as Flat).map(([k, v]) => [k, ren(v)]),
  );
  // What changed (hvaEndret) is new in format 2; the verdicts themselves must match.
  const vist = json(await visning(dir, lager)) as Record<
    string,
    { forrige?: Record<string, unknown> }
  >;
  for (const o of Object.values(vist))
    if (o.forrige)
      for (const k of ["endringer", "fil", "ukjent"]) delete o.forrige[k];
  if (!isDeepStrictEqual(vist, forventet))
    throw new Error("migrering: visningen endret seg");
  return lager;
}

async function skriv(fil: string, data: unknown) {
  const tmp = `${fil}.${process.pid}.${Date.now()}.tmp`;
  try {
    await mkdir(path.dirname(fil), { recursive: true });
    await writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
    await rename(tmp, fil);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}

/** Read the store; a format-1 file is backed up to _arkiv/<date>/ and migrated on first read. */
export async function lesLager(dir: string, fil = path.join(dir, FIL)) {
  let data: unknown;
  try {
    data = JSON.parse(await readFile(fil, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT")
      return { format: 2, sesong: SESONG, elementer: {} } as Lager;
    throw err;
  }
  if ((data as Lager).format === 2) {
    await restemple(dir, data as Lager);
    return data as Lager;
  }
  const lager = await migrer(dir, data as Flat);
  const dato = new Date(Date.now()).toISOString().slice(0, 10);
  const arkiv = path.join(dir, "_arkiv", dato);
  await mkdir(arkiv, { recursive: true });
  await writeFile(
    path.join(arkiv, "media-vurdering.format1.json"),
    JSON.stringify(data, null, 2) + "\n",
  );
  await appendFile(
    path.join(arkiv, "README.txt"),
    "media-vurdering.format1.json: vurderingene før flyttingen til format 2 (vurdering per innholdshash).\n",
  );
  await skriv(fil, lager);
  return lager;
}

/** <store>.lock (O_EXCL), shared with medie.lås in python: one read-modify-write at a time across processes. */
export async function medLås<T>(fil: string, f: () => Promise<T>): Promise<T> {
  const lås = `${fil}.lock`;
  const frist = Date.now() + 10_000;
  await mkdir(path.dirname(fil), { recursive: true });
  for (;;) {
    try {
      await (await open(lås, "wx")).close();
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      const info = await stat(lås).catch(() => null);
      // A writer that died holding it.
      if (info && Date.now() - info.mtimeMs > 30_000) {
        await unlink(lås).catch(() => {});
        continue;
      }
      if (Date.now() > frist) throw new Error(`${lås} er låst`);
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  try {
    return await f();
  } finally {
    await unlink(lås).catch(() => {});
  }
}

// One writer at a time: «Godkjenn alle på dagen» posts in parallel.
let kø: Promise<unknown> = Promise.resolve();
export function endreLager<T>(
  dir: string,
  f: (l: Lager) => Promise<T> | T,
  fil = path.join(dir, FIL),
): Promise<T> {
  const svar = kø.then(() =>
    medLås(fil, async () => {
      const l = await lesLager(dir, fil);
      const ut = await f(l);
      await skriv(fil, l);
      return ut;
    }),
  );
  kø = svar.catch(() => {});
  return svar;
}

/** Save or clear (no verdict, no note) one id; what it replaces goes to historikk. */
export async function settVurdering(
  dir: string,
  l: Lager,
  fil: string,
  o: Oppføring,
  /** The content the verdict was given to, when it is not what is there now (a segment's seen take). */
  sett?: string,
) {
  const e = (l.elementer[versionKey(fil)] ??= {
    vurderinger: [],
    historikk: [],
  });
  e.historikk.push(...e.vurderinger.filter((v) => v.fil === fil));
  e.vurderinger = e.vurderinger.filter((v) => v.fil !== fil);
  if (!o.vurdering && !o.notat && !o.tagger?.length) return null;
  const n = sett
    ? { stempel: sett, hash: async () => sett }
    : await nå(dir, fil);
  const tekst = sett ? null : await øyeblikkTekst(fil);
  const v = ren<Vurdering>({
    ...o,
    ...(tekst != null ? { tekst, hashVersjon: HASH_VERSJON } : {}),
    versjon: n.stempel ?? undefined,
    hash: (await n.hash()) ?? ALLTID,
    fil,
  });
  e.vurderinger.push(v);
  return v;
}

/** Files renamed on disk (Ta i bruk, rydd-kandidater): the verdicts follow, hashes stay. */
export function flyttFiler(l: Lager, ny: (fil: string) => string) {
  for (const [id, e] of Object.entries(l.elementer)) {
    for (const v of [...e.vurderinger, ...e.historikk]) v.fil = ny(v.fil);
    // A rename never leaves its element: versionKey(new) === versionKey(old).
    if (e.vurderinger.some((v) => versionKey(v.fil) !== id))
      throw new Error(`flytting ut av elementet ${id}`);
  }
}

/** Count the verdict on `fil` as given to what is there now (Ta i bruk: the promoted file). */
export async function stemple(dir: string, l: Lager, fil: string) {
  const v = l.elementer[versionKey(fil)]?.vurderinger.find(
    (x) => x.fil === fil,
  );
  if (!v) return;
  const n = await nå(dir, fil);
  v.hash = (await n.hash()) ?? ALLTID;
  if (n.stempel) v.versjon = n.stempel;
  const tekst = await øyeblikkTekst(fil);
  if (tekst != null) Object.assign(v, { tekst, hashVersjon: HASH_VERSJON });
}

/** The day's newest Julius join's segments: the highest dag-NN-vN.segmenter.json, else the plain name's. */
export async function nyesteSegmenter<T = unknown>(
  dir: string,
  dag: number,
): Promise<T[]> {
  const mappe = path.join(dir, "video/julius");
  const navn = (await readdir(mappe).catch(() => [] as string[]))
    .filter((f) =>
      new RegExp(
        `^dag-${String(dag).padStart(2, "0")}(-v\\d+)?\\.segmenter\\.json$`,
      ).test(f),
    )
    .sort(
      (a, b) =>
        variantOf(b.replace(".segmenter.json", ".mp4")) -
        variantOf(a.replace(".segmenter.json", ".mp4")),
    );
  if (!navn.length) return [];
  return readFile(path.join(mappe, navn[0]), "utf8")
    .then((t) => JSON.parse(t) as T[])
    .catch(() => []);
}

/**
 * Whether a verdict id names something that exists: a Julius segment of the script
 * (julius-manus.json), a guide/script id Gjennomgang makes, or a media path; every
 * day number in it is 1–24. ponytail: media paths are checked by shape, not on disk.
 */
export function kjentId(id: string): boolean {
  for (const m of id.matchAll(/dag[-/]?(\d+)/g))
    if (!(Number(m[1]) >= 1 && Number(m[1]) <= 24)) return false;
  const seg = id.match(/^(?:video|manus)\/julius\/dag-(\d\d)#s(\d+)$/);
  if (seg)
    return !!(manus as Record<string, { s: number }[]>)[
      String(Number(seg[1]))
    ]?.some((x) => x.s === Number(seg[2]));
  if (id.includes("#")) return false;
  if (/\/[^/]+\.[a-z0-9]{2,4}$/i.test(id)) return true;
  return [
    /^dag\/\d\d\/[a-z]+$/,
    /^manus\/(julius|radio)\/dag-\d\d$/,
    /^ugleposten\/k\d+$/,
    /^sledeflukt\/[\w-]+$/,
    /^krypto\/\d+$/,
    /^forsesong\/[\w-]+$/,
    /^historien\/[^/]+$/,
    /^(finale|symboler)$/,
  ].some((r) => r.test(id));
}

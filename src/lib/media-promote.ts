import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  appendFile,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { variantOf, versionKey } from "./media-status";
import { segmentId, type Segment } from "./segmenter";
import {
  endreLager,
  flyttFiler,
  gjeldende,
  lesLager,
  stemple,
  type Lager,
} from "./vurdering-lager";

/**
 * «Ta i bruk vN»: the plain file becomes <name>.old-N.<ext>, <name>-vN.<ext> the
 * plain name. The poster (.jpg beside an .mp4), the Julius segment sidecar
 * (.segmenter.json) and every .meta.json sidecar move with it; review state and inventory rows follow the paths. Nothing is
 * overwritten: every target is checked first, and a failed rename rolls back the
 * ones before it. Each promotion is appended to media-promoteringer.log.
 */
export async function taIBruk(dir: string, kandidat: string) {
  const key = versionKey(kandidat);
  const n = variantOf(kandidat);
  if (!n || key === kandidat) throw new Error("ikke en -vN-kandidat");
  const lager = await lesLager(dir);
  const v = lager.elementer[key]?.vurderinger.find((x) => x.fil === kandidat);
  // «ok» = usable with flaws, counts as approved (brukbar in media-status.ts).
  if (v?.vurdering !== "godkjent" && v?.vurdering !== "ok")
    throw new Error(`${kandidat} er ikke godkjent`);
  if (!(await gjeldende(dir, v)))
    throw new Error(
      `${kandidat} er endret etter at den ble godkjent: vurder den på nytt før du tar den i bruk`,
    );

  // A segmented Julius video is usable only when every segment is (statusmodell.md):
  // ✓/◐ on the take that is in this video.
  const segmenter = await readFile(
    path.join(dir, kandidat.replace(/\.mp4$/, ".segmenter.json")),
    "utf8",
  )
    .then((t) => JSON.parse(t) as Segment[])
    .catch(() => []);
  const dom = (s: number) => {
    const id = segmentId(kandidat, s);
    return lager.elementer[id]?.vurderinger.find((y) => y.fil === id);
  };
  // An open cut check (✂ done, Hans has not heard it with G) is not usable (Hans 13 Nov).
  const kuttsjekk = segmenter.filter((x) => dom(x.s)?.kuttsjekk);
  if (kuttsjekk.length)
    throw new Error(
      `${kandidat}: ${kuttsjekk.map((x) => `s${x.s}`).join(", ")} venter på kuttsjekk (hør kuttet og gi G først)`,
    );
  const åpne = segmenter.filter((x) => {
    const id = segmentId(kandidat, x.s);
    const d = lager.elementer[id]?.vurderinger.find((y) => y.fil === id);
    return !(
      (d?.vurdering === "godkjent" || d?.vurdering === "ok") &&
      (!x.raw || d.hash === x.raw)
    );
  });
  if (åpne.length)
    throw new Error(
      `${kandidat}: ${åpne.map((x) => `s${x.s}`).join(", ")} er ikke godkjent`,
    );

  const ext = path.extname(key);
  const stem = key.slice(0, -ext.length);
  const folder = path.join(dir, path.dirname(key));
  const names = await readdir(folder);
  const base = path.basename(stem);
  const oldN =
    Math.max(
      0,
      ...names.map((f) =>
        Number(
          f.match(new RegExp(`^${escape(base)}\\.old-(\\d+)\\.`))?.[1] ?? 0,
        ),
      ),
    ) + 1;
  const old = `${stem}.old-${oldN}${ext}`;

  // The file, its poster and their sidecars: [from, to] relative to dir.
  const exts = ext === ".mp4" ? [ext, ".jpg"] : [ext];
  const pairs = (from: string, to: string) => [
    ...exts.flatMap((e) =>
      ["", ".meta.json"].map((side) => [from + e + side, to + e + side]),
    ),
    ...(ext === ".mp4"
      ? [
          [`${from}.segmenter.json`, `${to}.segmenter.json`],
          [`${from}.lyd.json`, `${to}.lyd.json`],
        ]
      : []),
  ];
  const has = (rel: string) => names.includes(path.basename(rel));
  // Older candidates (-vK, K < N) go to the archive too, or they would show as newer than v N.
  const eldre = names
    .map((f) =>
      Number(
        f.match(new RegExp(`^${escape(base)}-v(\\d+)${escape(ext)}$`))?.[1] ??
          0,
      ),
    )
    .filter((k) => k > 0 && k < n)
    .sort((a, b) => a - b);
  const flytt = [
    ...pairs(stem, `${stem}.old-${oldN}`),
    ...eldre.flatMap((k, i) =>
      pairs(`${stem}-v${k}`, `${stem}.old-${oldN + 1 + i}`),
    ),
    ...pairs(`${stem}-v${n}`, stem),
  ].filter(([from]) => has(from));
  if (!has(kandidat)) throw new Error(`${kandidat} finnes ikke`);
  // A plain name is vacated by the first moves; anything else already there is refused.
  const fra = new Set(flytt.map(([f]) => f));
  for (const [, to] of flytt)
    if (has(to) && !fra.has(to)) throw new Error(`${to} finnes fra før`);

  const done: string[][] = [];
  try {
    for (const [from, to] of flytt) {
      await rename(path.join(dir, from), path.join(dir, to));
      done.push([from, to]);
    }
  } catch (err) {
    for (const [from, to] of done.reverse())
      await rename(path.join(dir, to), path.join(dir, from)).catch(() => {});
    throw err;
  }

  // The status source compares candidates against the version in use.
  const side = path.join(dir, `${key}.meta.json`);
  // A sidecar that is not JSON is left alone.
  await readJson(side, {})
    .then((m) => writeJson(side, { ...m, fra_versjon: n }))
    .catch(() => {});

  const flyttet = new Map(flytt.map(([f, t]) => [f, t]));
  const ny = (p: string) => flyttet.get(p) ?? p;
  // The verdicts follow the files; the promoted one counts as given to the file now in use.
  await endreLager(dir, async (l) => {
    flyttFiler(l, ny);
    await stemple(dir, l, key);
  });

  const invPath = path.join(dir, "media-inventar.json");
  const inv = await readJson<
    { path: string; status: string; reasons?: string[] }[] | null
  >(invPath, null);
  if (inv) {
    // The promoted file is the only row whose status is not known without computing it.
    const nå = await statusFor(dir, key);
    await writeJson(
      invPath,
      inv.map((r) =>
        !flyttet.has(r.path)
          ? r
          : versionKey(ny(r.path)) !== ny(r.path)
            ? { ...r, path: ny(r.path), status: "arkiv" }
            : { ...r, path: ny(r.path), ...nå },
      ),
    );
  }

  const arkiv = flytt
    .filter(([f, t]) => f !== key && f.endsWith(ext) && t.includes(".old-"))
    .map(([f, t]) => `; ${f} -> ${t}`)
    .join("");
  const linje = `${new Date(Date.now()).toISOString()} ${kandidat} -> ${key}; ${key} -> ${old}${arkiv}\n`;
  await appendFile(path.join(dir, "media-promoteringer.log"), linje);
  console.log(`[ta-i-bruk] ${linje.trim()}`);
  return { key, old, flyttet: flytt };
}

// Same computation as the inventory (medie.py), for one file; run from the repo root.
async function statusFor(dir: string, key: string) {
  try {
    const { stdout } = await promisify(execFile)("python3", [
      "assets/bin/medie.py",
      "statusjson",
      dir,
      key,
    ]);
    return JSON.parse(stdout) as { status: string; reasons: string[] };
  } catch {
    return {
      status: "unknown",
      reasons: ["status kunne ikke beregnes: kjør mise run inventar"],
    };
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(p: string, data: unknown) {
  const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
  await rename(tmp, p);
}

/**
 * Julius videos approved whole before segment review (Hans 13 Nov): an approved/OK
 * verdict on the joined video counts as the same verdict on each of its segments.
 * Writes the missing segment verdicts onto `l` (given to the raw take in the
 * segmenter.json), marked «arvet fra hele videoen». Returns the ids written.
 */
export async function arvFraHeleVideoen(dir: string, l: Lager) {
  const ut: string[] = [];
  const nå = new Date(Date.now()).toISOString();
  for (const [key, e] of Object.entries(l.elementer)) {
    if (!/^video\/julius\/dag-\d+\.mp4$/.test(key)) continue;
    for (const v of [...e.vurderinger]) {
      if (v.vurdering !== "godkjent" && v.vurdering !== "ok") continue;
      if (!(await gjeldende(dir, v))) continue;
      const segmenter = await readFile(
        path.join(dir, v.fil.replace(/\.mp4$/, ".segmenter.json")),
        "utf8",
      )
        .then((t) => JSON.parse(t) as Segment[])
        .catch(() => []);
      const id = (s: number) => segmentId(v.fil, s);
      // Only a video whose segments nobody has judged: segment review wins once it started.
      if (!segmenter.length || segmenter.some((x) => l.elementer[id(x.s)]))
        continue;
      for (const x of segmenter) {
        const hash = x.raw ?? "*";
        l.elementer[id(x.s)] = {
          vurderinger: [
            {
              vurdering: v.vurdering,
              ...(v.notat ? { notat: v.notat } : {}),
              oppdatert: nå,
              versjon: hash,
              hash,
              fil: id(x.s),
              merknad: "arvet fra hele videoen",
            },
          ],
          historikk: [],
        };
        ut.push(id(x.s));
      }
    }
  }
  return ut;
}

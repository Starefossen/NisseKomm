import {
  appendFile,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { variantOf, versionKey } from "./media-status";

/**
 * «Ta i bruk vN»: the plain file becomes <name>.old-N.<ext>, <name>-vN.<ext> the
 * plain name. The poster (.jpg beside an .mp4) and every .meta.json sidecar move
 * with it; review state and inventory rows follow the paths. Nothing is
 * overwritten: every target is checked first, and a failed rename rolls back the
 * ones before it. Each promotion is appended to media-promoteringer.log.
 */
export async function taIBruk(dir: string, kandidat: string) {
  const key = versionKey(kandidat);
  const n = variantOf(kandidat);
  if (!n || key === kandidat) throw new Error("ikke en -vN-kandidat");
  const vurdPath = path.join(dir, "media-vurdering.json");
  const vurd: Record<string, { vurdering?: string }> = await readJson(
    vurdPath,
    {},
  );
  if (vurd[kandidat]?.vurdering !== "godkjent")
    throw new Error(`${kandidat} er ikke godkjent`);

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
  const pairs = (from: string, to: string) =>
    exts.flatMap((e) =>
      ["", ".meta.json"].map((side) => [from + e + side, to + e + side]),
    );
  const has = (rel: string) => names.includes(path.basename(rel));
  const flytt = [
    ...pairs(stem, `${stem}.old-${oldN}`),
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

  const flyttet = new Map(flytt.map(([f, t]) => [f, t]));
  const ny = (p: string) => flyttet.get(p) ?? p;
  // Re-read: the verdict route may have written while the files moved.
  const vurdNå: typeof vurd = await readJson(vurdPath, {});
  await writeJson(
    vurdPath,
    Object.fromEntries(Object.entries(vurdNå).map(([p, v]) => [ny(p), v])),
  );

  const invPath = path.join(dir, "media-inventar.json");
  const inv = await readJson<
    { path: string; status: string; reasons?: string[] }[] | null
  >(invPath, null);
  if (inv)
    await writeJson(
      invPath,
      inv.map((r) =>
        !flyttet.has(r.path)
          ? r
          : versionKey(ny(r.path)) !== ny(r.path)
            ? { ...r, path: ny(r.path), status: "arkiv" }
            : {
                ...r,
                path: ny(r.path),
                status: "unknown",
                reasons: [`tatt i bruk fra v${n}: kjør mise run inventar`],
              },
      ),
    );

  const linje = `${new Date(Date.now()).toISOString()} ${kandidat} -> ${key}; ${key} -> ${old}\n`;
  await appendFile(path.join(dir, "media-promoteringer.log"), linje);
  console.log(`[ta-i-bruk] ${linje.trim()}`);
  return { key, old, flyttet: flytt };
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

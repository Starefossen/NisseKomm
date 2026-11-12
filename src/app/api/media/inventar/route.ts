import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir, mediaStatus } from "@/lib/media-server";

interface Row {
  path: string;
  status: "current" | "stale" | "unknown" | "missing";
  reasons: string[];
  meta?: unknown;
}

const mtime = async (p: string) => (await stat(p).catch(() => null))?.mtimeMs;

/**
 * One row per file on disk, plus the jobs without a file yet. Presence, metadata
 * and the sidecar come from disk on every request; the status (assets/bin/medie.py
 * needs the docs and prompts, which the image lacks) comes from media-inventar.json,
 * which generators rewrite after each sidecar. A file or sidecar newer than that
 * inventory shows as «ukjent» rather than a status that may be out of date.
 */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const dir = mediaDir();
  const invPath = path.join(dir, "media-inventar.json");
  const inv: Row[] = await readFile(invPath, "utf8")
    .then((t) => JSON.parse(t))
    .catch(() => []);
  const invTime = (await mtime(invPath)) ?? 0;
  const byPath = new Map(inv.map((r) => [r.path, r]));
  const onDisk = await mediaStatus(dir);
  const rows: Row[] = await Promise.all(
    onDisk.map(async (f) => {
      const row = byPath.get(f.path);
      if (f.size === null) {
        return {
          path: f.path,
          status: "missing" as const,
          reasons: row?.reasons ?? [],
        };
      }
      const side = path.join(dir, `${f.path}.meta.json`);
      const meta = await readFile(side, "utf8")
        .then((t) => {
          const m = JSON.parse(t);
          return {
            generator: m.generator,
            created: m.created,
            source: m.source,
            bakfylt: m.bakfylt,
          };
        })
        .catch(() => null);
      const changed = Math.max(
        (await mtime(path.join(dir, f.path))) ?? 0,
        (await mtime(side)) ?? 0,
      );
      if (!row || changed > invTime) {
        return {
          path: f.path,
          status: "unknown" as const,
          reasons: ["inventaret er eldre enn filen: kjør mise run inventar"],
          meta,
        };
      }
      return { ...row, meta };
    }),
  );
  return Response.json(rows);
}

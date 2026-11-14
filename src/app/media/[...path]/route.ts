import { realpath } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import {
  authorizeMedia,
  mediaDir,
  mediaParts,
  resolveMedia,
  serveMedia,
} from "@/lib/media-server";

// Default deny: only the kid app's folders are open. Everything else (strek,
// promo, _arkiv, ...) needs a parent in lan mode. An exact match also closes
// APFS case and Unicode folding (STREK, ſtrek, ﬆrek all open «strek»).
const KID_DIRS = ["video", "audio", "music", "feed", "spill"];

async function kidFile(parts: string[]): Promise<boolean> {
  if (!KID_DIRS.includes(parts[0])) return false;
  // A symlink must not lead from a kid folder into a parent-only one.
  const abs = resolveMedia(parts);
  if (!abs) return true; // serveMedia answers 400
  const [real, dir] = await Promise.all([
    realpath(abs).catch(() => null),
    realpath(path.join(mediaDir(), parts[0])).catch(() => null),
  ]);
  return !real || (!!dir && real.startsWith(dir + path.sep));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const parts = mediaParts((await params).path);
  if (!parts) return new Response("Ugyldig sti", { status: 400 });
  if (!(await kidFile(parts))) {
    const nei = await authorizeMedia(req);
    if (nei) return nei;
  }
  return serveMedia(
    parts,
    req.headers.get("range"),
    undefined,
    req.headers.get("if-none-match"),
  );
}

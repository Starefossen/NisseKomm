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
import { hasRole } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { åpenTilDag } from "@/lib/kode";
import { authenticate } from "@/lib/mcp/auth";
import { isLanMode } from "@/lib/mode";

// Default deny: only the kid app's folders are open. Everything else (strek,
// promo, _arkiv, ...) needs a parent in lan mode. An exact match also closes
// APFS case and Unicode folding (STREK, ſtrek, ﬆrek all open «strek»).
const KID_DIRS = ["video", "audio", "music", "feed", "spill"];
// The login screen's backdrop, shown before any session exists.
const PUBLIC_FILES = ["feed/julius-kontor.jpg"];

// Day files (dag-03.mp4, dag03-A-1.mp3, grotte-dag24.mp4) open on their day;
// the rest of a kid folder only needs a session.
export const fileDay = (parts: string[]) =>
  Number(parts.at(-1)?.match(/(?:^|[-_])dag-?(\d{1,2})(?!\d)/i)?.[1] ?? 0);

// Cookie or MCP Bearer (Varden); a parent only counts in lan mode.
async function nivå(req: NextRequest): Promise<"parent" | "kid" | null> {
  if (req.headers.get("authorization")) {
    const c = await authenticate(req);
    if (c?.level === "parent") return isLanMode() ? "parent" : null;
    return c?.level === "read" ? "kid" : null;
  }
  if (await hasRole(req, "parent")) return "parent";
  return (await hasRole(req, "kid")) ? "kid" : null;
}

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
  } else if (!PUBLIC_FILES.includes(parts.join("/"))) {
    const n = await nivå(req);
    if (!n) return new Response("Ikke innlogget", { status: 401 });
    if (n === "parent") return serve(parts, req);
    const dag = fileDay(parts);
    if (dag) {
      const state = await getStore().getState();
      if (dag > åpenTilDag(state["day-offset"]))
        return new Response("Ikke ennå", { status: 403 });
    }
  }
  return serve(parts, req);
}

const serve = (parts: string[], req: NextRequest) =>
  serveMedia(
    parts,
    req.headers.get("range"),
    undefined,
    req.headers.get("if-none-match"),
  );

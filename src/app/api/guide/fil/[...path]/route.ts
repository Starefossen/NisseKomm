import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { assetFil } from "@/lib/guide-innhold";

const TYPER: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const ikkeFunnet = () => new Response("Ikke funnet", { status: 404 });

/** Reference images from assets/ (gitignored, dev box only); parent and lan only. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const rel = assetFil((await params).path);
  if (!rel) return ikkeFunnet();
  // A symlink inside assets/ must not lead outside it.
  const [root, real] = await Promise.all([
    realpath(path.join(process.cwd(), "assets")).catch(() => null),
    realpath(path.join(process.cwd(), rel)).catch(() => null),
  ]);
  if (!root || !real?.startsWith(root + path.sep)) return ikkeFunnet();
  const data = await readFile(real).catch(() => null);
  if (!data) return ikkeFunnet();
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPER[path.extname(rel).toLowerCase()],
      "Cache-Control": "private, no-cache",
    },
  });
}

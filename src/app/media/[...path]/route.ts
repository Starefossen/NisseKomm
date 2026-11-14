import type { NextRequest } from "next/server";
import { authorizeMedia, mediaParts, serveMedia } from "@/lib/media-server";

const PARENT_DIRS = ["strek", "promo", "_arkiv"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const parts = mediaParts((await params).path);
  if (!parts) return new Response("Ugyldig sti", { status: 400 });
  // Prank sketches show tonight's setup, promos show the app, _arkiv holds rejected takes: parents only (lan mode).
  // Lowercased: MEDIA_DIR on APFS is case-insensitive.
  if (PARENT_DIRS.includes(parts[0].toLowerCase())) {
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

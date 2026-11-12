import type { NextRequest } from "next/server";
import { authorizeMedia, serveMedia } from "@/lib/media-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const parts = (await params).path;
  // Prank sketches show tonight's setup, promos show the app, _arkiv holds rejected takes: parents only (lan mode).
  if (["strek", "promo", "_arkiv"].includes(parts[0])) {
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

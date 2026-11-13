import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";

/** The Julius segment sidecar beside a video (JSON is not served under /media); [] when there is none. */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const fil = req.nextUrl.searchParams.get("fil") ?? "";
  if (!/^video\/julius\/dag-\d\d(-v\d+|\.old-\d+)?\.mp4$/.test(fil))
    return new Response("Ugyldig forespørsel", { status: 400 });
  const side = path.join(mediaDir(), fil.replace(/\.mp4$/, ".segmenter.json"));
  const tekst = await readFile(side, "utf8").catch(() => "[]");
  return new Response(tekst, {
    headers: { "Content-Type": "application/json" },
  });
}

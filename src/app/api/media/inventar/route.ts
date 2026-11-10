import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";

/** Serves media-inventar.json, written into MEDIA_DIR by assets/bin/inventar.py. */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  try {
    const data = await readFile(path.join(mediaDir(), "media-inventar.json"));
    return new Response(data, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json([]);
  }
}

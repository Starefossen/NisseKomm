import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir, resolveMedia } from "@/lib/media-server";
import { taIBruk } from "@/lib/media-promote";

/** Hans' «Ta i bruk vN»: parent only, lan mode only (authorizeMedia). */
export async function POST(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as {
    kandidat?: unknown;
  } | null;
  const kandidat = body?.kandidat;
  if (typeof kandidat !== "string" || !resolveMedia(kandidat.split("/")))
    return new Response("Ugyldig forespørsel", { status: 400 });
  try {
    return Response.json(await taIBruk(mediaDir(), kandidat));
  } catch (err) {
    return new Response(String((err as Error).message), { status: 409 });
  }
}

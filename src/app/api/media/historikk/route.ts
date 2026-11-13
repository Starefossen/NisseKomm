import type { NextRequest } from "next/server";
import { historikk } from "@/lib/historikk";
import { authorizeMedia, mediaDir } from "@/lib/media-server";
import { kjentId } from "@/lib/vurdering-lager";

/** «Historikk ▸» for one Gjennomgang element (parent, lan mode). */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!kjentId(id) || id.includes("..") || id.startsWith("/"))
    return new Response("Ugyldig forespørsel", { status: 400 });
  return Response.json(await historikk(mediaDir(), id));
}

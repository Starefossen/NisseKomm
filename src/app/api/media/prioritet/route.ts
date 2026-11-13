import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";
import { LagerNyere, prioriter, UgyldigPrioritet } from "@/lib/vurdering-lager";

/** POST {id, nivaa: "hast"|"høy", grunn, frist?} or {id, fjern: true}: an agent's «look at this first». */
export async function POST(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return new Response("Ugyldig forespørsel", { status: 400 });
  // Same naming as /api/media/vurdering: a Bearer token is an agent (X-Agent names it).
  const av = req.headers.get("authorization")
    ? `agent:${(req.headers.get("x-agent") ?? "ukjent").replace(/[^\w.-]/g, "").slice(0, 40) || "ukjent"}`
    : "hans";
  try {
    return Response.json({
      ok: true,
      prioritet: await prioriter(mediaDir(), body, av),
    });
  } catch (err) {
    if (err instanceof UgyldigPrioritet)
      return new Response(err.message, { status: 400 });
    if (err instanceof LagerNyere)
      return new Response(err.message, { status: 409 });
    return new Response("Serverfeil", { status: 500 });
  }
}

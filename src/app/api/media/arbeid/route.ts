import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";
import {
  arbeidVurdering,
  LagerNyere,
  UgyldigPrioritet,
} from "@/lib/vurdering-lager";

/** POST {id, hva, av}: an agent is working on it; {id, ferdig: true} ends it. */
export async function POST(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return new Response("Ugyldig forespørsel", { status: 400 });
  // A Bearer token is an agent, named by `av` (or X-Agent); the guide session is Hans.
  const navn = String(body.av ?? req.headers.get("x-agent") ?? "ukjent")
    .replace(/[^\w.-]/g, "")
    .slice(0, 40);
  const av = req.headers.get("authorization")
    ? `agent:${navn || "ukjent"}`
    : "hans";
  try {
    return Response.json({
      ok: true,
      arbeid: await arbeidVurdering(mediaDir(), body, av),
    });
  } catch (err) {
    if (err instanceof UgyldigPrioritet)
      return new Response(err.message, { status: 400 });
    if (err instanceof LagerNyere)
      return new Response(err.message, { status: 409 });
    return new Response("Serverfeil", { status: 500 });
  }
}

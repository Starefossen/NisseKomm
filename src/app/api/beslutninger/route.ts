import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import {
  lesBeslutninger,
  opprettBeslutning,
  svarBeslutning,
  UgyldigBeslutning,
} from "@/lib/beslutninger";

export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  return Response.json(await lesBeslutninger());
}

/**
 * POST {id, valg, hvorfor?}: Hans answers (guide session only, never a Bearer agent).
 * POST {sporsmal, kontekst, valg[], anbefalt?, lenker?, slug?}: an agent opens one (X-Agent names it).
 */
export async function POST(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return new Response("Ugyldig forespørsel", { status: 400 });
  const agent = req.headers.get("authorization");
  try {
    if ("id" in body) {
      if (agent)
        return new Response("Bare Hans svarer på en beslutning", {
          status: 403,
        });
      return Response.json({
        ok: true,
        beslutning: await svarBeslutning(body),
      });
    }
    const av = agent
      ? `agent:${(req.headers.get("x-agent") ?? "ukjent").replace(/[^\w.-]/g, "").slice(0, 40) || "ukjent"}`
      : "hans";
    return Response.json({
      ok: true,
      beslutning: await opprettBeslutning(body, av),
    });
  } catch (err) {
    if (err instanceof UgyldigBeslutning)
      return new Response(err.message, { status: 400 });
    return new Response("Serverfeil", { status: 500 });
  }
}

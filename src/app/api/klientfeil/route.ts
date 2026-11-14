/**
 * POST {melding, rute}: an error from a screen (kid or parent session), at most
 *   10 a minute per session. 204, or 401/429.
 * GET: the newest 200, newest first (parent session or Bearer JWT, lan mode).
 */
import type { NextRequest } from "next/server";
import { hasRole, jsonError, readJsonBody, sessionId } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { lagreKlientfeil, lesKlientfeil, renskFeil } from "@/lib/klientfeil";
import { authorizeMedia } from "@/lib/media-server";
import { sendPush } from "@/lib/notify/push";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rolle = (await hasRole(request, "kid"))
    ? "kid"
    : (await hasRole(request, "parent"))
      ? "parent"
      : null;
  if (!rolle) return jsonError("Ikke innlogget", 401);
  const body = await readJsonBody(request);
  if (body instanceof Response) return body;
  const store = getStore();
  if ((await store.hit(`klientfeil:${sessionId(request)}`, 60_000)) > 10)
    return jsonError("For mange", 429);
  const feil = renskFeil(body, rolle, request.headers.get("user-agent") ?? "");
  if (!feil) return jsonError("Ugyldig forespørsel", 400);
  await lagreKlientfeil(store, feil);
  // One push per 10 minutes; the list in Innstillinger has the rest.
  if ((await store.hit("push-klientfeil", 600_000)) === 1)
    void sendPush(store, {
      type: "feil",
      title: "Feil på en skjerm",
      // No message text: it travels through Apple's push service.
      body: `${feil.rolle === "kid" ? "Barneskjermen" : "Foreldreskjermen"} meldte en feil. Se Innstillinger.`,
      url: "/nissemor-guide/innstillinger",
    });
  return new Response(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  const denied = await authorizeMedia(request);
  if (denied) return denied;
  return Response.json(await lesKlientfeil(getStore()));
}

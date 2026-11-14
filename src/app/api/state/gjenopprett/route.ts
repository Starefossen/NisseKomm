/**
 * Lan only, parent (guide cookie, or parent Bearer for
 * `mise run gjenopprett-sesong`).
 * GET   Every snapshot, newest first: { id, sesong, grunn, arkivert, nøkler, brev }.
 * POST  { id, bekreft: "GJENOPPRETT" }: restores all keys of snapshot `id`,
 *       codes included, after a fresh snapshot of today's state (`før`).
 */
import { NextRequest, NextResponse } from "next/server";
import { checkOrigin, hasRole, jsonError, readJsonBody } from "@/lib/auth";
import { getStore, gjenopprett, storageBackend } from "@/lib/db";
import { authenticate } from "@/lib/mcp/auth";
import { isLanMode } from "@/lib/mode";

async function nekt(request: NextRequest, skriver: boolean) {
  if (!isLanMode()) return jsonError("Ikke tilgjengelig", 404);
  if (request.headers.get("authorization")) {
    if ((await authenticate(request))?.level !== "parent")
      return jsonError("Bare for foreldre", 403);
  } else {
    if (!(await hasRole(request, "parent")))
      return jsonError("Bare for foreldre", 403);
    if (skriver) {
      const nei = checkOrigin(request);
      if (nei) return nei;
    }
  }
  if (storageBackend() !== "server")
    return jsonError("Ingen servertilstand", 409);
  return null;
}

export async function GET(request: NextRequest) {
  const nei = await nekt(request, false);
  if (nei) return nei;
  const liste = (await getStore().arkiv()).reverse().map((a) => ({
    id: a.id,
    sesong: a.sesong,
    grunn: a.grunn,
    arkivert: a.arkivert,
    nøkler: Object.keys(a.data).length,
    brev: Array.isArray(a.data["nissekomm-santa-letters"])
      ? a.data["nissekomm-santa-letters"].length
      : 0,
  }));
  return NextResponse.json(liste);
}

export async function POST(request: NextRequest) {
  const nei = await nekt(request, true);
  if (nei) return nei;
  // Bearer (the mise task) has no Origin; the cookie path stays same-origin.
  const body = request.headers.get("authorization")
    ? ((await request.json().catch(() => null)) ?? {})
    : await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  if (body.bekreft !== "GJENOPPRETT")
    return jsonError("Skriv GJENOPPRETT for å bekrefte", 400);
  if (!Number.isSafeInteger(body.id)) return jsonError("Ugyldig id", 400);
  const r = await gjenopprett(body.id as number);
  if (!r) return jsonError("Fant ikke arkivet", 404);
  return NextResponse.json({
    gjenopprettet: r.fra.id,
    sesong: r.fra.sesong,
    arkivert: r.fra.arkivert,
    før: r.før?.id ?? null,
  });
}

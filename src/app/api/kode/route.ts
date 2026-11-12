/**
 * POST /api/kode  Body: { dag, kode }. Kid or parent session.
 *   200 { ok: true, dag, kode }  the day's code; recorded in nissekomm-codes
 *   200 { ok: true, bonus }      a bonus quest's parent code (day `bonus`)
 *   200 { ok: false }            wrong
 *   403                          the day is not open yet (server date; any day in test mode)
 *   429 { ventSek }              more than 10 wrong tries a minute for this role
 * The codes live only on the server (src/lib/oppdrag.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { hasRole, jsonError, readJsonBody } from "@/lib/auth";
import { getStore, storageBackend } from "@/lib/db";
import { getServerDate } from "@/lib/date-utils";
import { feilForsøk, sjekkKode, ventSek, åpenTilDag } from "@/lib/kode";
import { notify } from "@/lib/notify";
import { eventsForWrite } from "@/lib/notify/events";

export async function POST(request: NextRequest) {
  const rolle = (await hasRole(request, "kid"))
    ? "kid"
    : (await hasRole(request, "parent"))
      ? "parent"
      : null;
  if (!rolle) return jsonError("Ikke innlogget", 401);
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  const { dag, kode } = body;
  if (
    typeof dag !== "number" ||
    !Number.isInteger(dag) ||
    dag < 1 ||
    dag > 24 ||
    typeof kode !== "string"
  )
    return jsonError("Ugyldig forespørsel", 400);
  const store = getStore();
  const state = await store.getState();
  if (dag > åpenTilDag(state["day-offset"]))
    return jsonError("Dagen er ikke åpnet ennå", 403);

  // Limit check, code check and count with no await between them, so parallel
  // requests can't all pass the limit before any of them is counted.
  const vent = ventSek(rolle);
  if (vent) return NextResponse.json({ ventSek: vent }, { status: 429 });
  const svar = sjekkKode(dag, kode);
  if (!svar.ok) feilForsøk(rolle);
  if (svar.ok && "kode" in svar && storageBackend() === "server") {
    const før = state["nissekomm-codes"];
    const dato = getServerDate(state["day-offset"]).toISOString();
    const etter = await store.putState("nissekomm-codes", [
      { kode: svar.kode, dato, day: dag },
    ]);
    for (const n of eventsForWrite("nissekomm-codes", før, etter))
      void notify(n);
  }
  return NextResponse.json(svar);
}

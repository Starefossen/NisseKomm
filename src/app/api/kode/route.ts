/**
 * POST /api/kode  Body: { dag, kode }. Kid or parent session.
 *   200 { ok: true, dag, kode }  the day's code; recorded in nissekomm-codes
 *   200 { ok: true, bonus }      a bonus quest's parent code (day `bonus`)
 *   200 { ok: false }            wrong
 *   429 { ventSek }              more than 10 tries a minute this session
 * The codes live only on the server (src/lib/oppdrag.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { hasRole, jsonError, readJsonBody, sessionToken } from "@/lib/auth";
import { getStore, storageBackend } from "@/lib/db";
import { getServerDate } from "@/lib/date-utils";
import { sjekkKode, ventSek } from "@/lib/kode";
import { notify } from "@/lib/notify";
import { eventsForWrite } from "@/lib/notify/events";

export async function POST(request: NextRequest) {
  if (!(await hasRole(request, "kid", "parent")))
    return jsonError("Ikke innlogget", 401);
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
  const nøkkel =
    sessionToken(request, "kid") ?? sessionToken(request, "parent") ?? "";
  const vent = ventSek(nøkkel);
  if (vent) return NextResponse.json({ ventSek: vent }, { status: 429 });

  const svar = sjekkKode(dag, kode);
  if (svar.ok && "kode" in svar && storageBackend() === "server") {
    const store = getStore();
    const state = await store.getState();
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

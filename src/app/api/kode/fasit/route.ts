/**
 * POST /api/kode/fasit  Body: { til }. Records days 1..til as solved and
 * returns { koder: { [dag]: kode } } for them (sim.solveUntil).
 * Only in lan mode: for a parent session (the guide shows the codes anyway),
 * or for the kids' session when test mode is on (Tidsmaskin, playthrough).
 * Never in public mode.
 */
import { NextRequest, NextResponse } from "next/server";
import { hasRole, jsonError, readJsonBody } from "@/lib/auth";
import { isLanMode } from "@/lib/mode";
import { getAllOppdrag } from "@/lib/oppdrag";
import { getStore, storageBackend } from "@/lib/db";
import { getServerDate } from "@/lib/date-utils";

const testmodus = () =>
  process.env.NEXT_PUBLIC_TEST_MODE === "true" ||
  process.env.NODE_ENV !== "production";

export async function POST(request: NextRequest) {
  if (!isLanMode()) return jsonError("Ikke tilgjengelig", 404);
  const ok =
    (await hasRole(request, "parent")) ||
    (testmodus() && (await hasRole(request, "kid")));
  if (!ok) return jsonError("Bare for foreldre", 403);
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  const til = body.til;
  if (typeof til !== "number" || !Number.isInteger(til) || til < 0 || til > 24)
    return jsonError("Ugyldig forespørsel", 400);
  const løste = getAllOppdrag().filter((o) => o.dag <= til);
  if (storageBackend() === "server" && løste.length) {
    const store = getStore();
    const dato = getServerDate(
      (await store.getState())["day-offset"],
    ).toISOString();
    await store.putState(
      "nissekomm-codes",
      løste.map((o) => ({ kode: o.kode.toUpperCase(), dato, day: o.dag })),
    );
  }
  return NextResponse.json({
    koder: Object.fromEntries(løste.map((o) => [o.dag, o.kode.toUpperCase()])),
  });
}

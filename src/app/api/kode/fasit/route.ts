/**
 * GET /api/kode/fasit  { koder: { [dag]: kode } } for sim.solveUntil.
 * Only in lan mode: for a parent session (the guide shows the codes anyway),
 * or for the kids' session when test mode is on (Tidsmaskin, playthrough).
 * Never in public mode.
 */
import { NextRequest, NextResponse } from "next/server";
import { hasRole, jsonError } from "@/lib/auth";
import { isLanMode } from "@/lib/mode";
import { getAllOppdrag } from "@/lib/oppdrag";

const testmodus = () =>
  process.env.NEXT_PUBLIC_TEST_MODE === "true" ||
  process.env.NODE_ENV !== "production";

export async function GET(request: NextRequest) {
  if (!isLanMode()) return jsonError("Ikke tilgjengelig", 404);
  const ok =
    (await hasRole(request, "parent")) ||
    (testmodus() && (await hasRole(request, "kid")));
  if (!ok) return jsonError("Bare for foreldre", 403);
  return NextResponse.json({
    koder: Object.fromEntries(getAllOppdrag().map((o) => [o.dag, o.kode])),
  });
}

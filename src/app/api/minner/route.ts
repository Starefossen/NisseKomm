/**
 * GET /api/minner?sesong=2026  Kid or parent: what a season left behind
 * (badges, letters per child, sled records, solved days; never codes), from
 * the season's fullest snapshot (a near-empty one taken after a reset
 * must not hide the letters). 404 when the season has no archive.
 */
import { NextRequest, NextResponse } from "next/server";
import { hasRole, jsonError } from "@/lib/auth";
import { getStore, type Arkiv } from "@/lib/db";
import { lagMinner } from "@/lib/minner";

export async function GET(request: NextRequest) {
  if (!(await hasRole(request, "kid", "parent")))
    return jsonError("Ikke innlogget", 401);
  const sesong = Number(request.nextUrl.searchParams.get("sesong"));
  if (!Number.isInteger(sesong)) return jsonError("Ugyldig sesong", 400);
  const størst = (d: unknown) => JSON.stringify(d).length;
  const a = (await getStore().arkiv(sesong)).reduce<Arkiv | undefined>(
    (best, x) => (!best || størst(x.data) >= størst(best.data) ? x : best),
    undefined,
  );
  if (!a) return jsonError("Ingen arkiv for sesongen", 404);
  return NextResponse.json(lagMinner(a));
}

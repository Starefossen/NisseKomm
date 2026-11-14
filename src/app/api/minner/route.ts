/**
 * GET /api/minner?sesong=2026  Kid or parent: what a season left behind
 * (badges, letters per child, sled records, solved days; never codes), from
 * the newest archive of that season. 404 when the season has no archive.
 */
import { NextRequest, NextResponse } from "next/server";
import { hasRole, jsonError } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { lagMinner } from "@/lib/minner";

export async function GET(request: NextRequest) {
  if (!(await hasRole(request, "kid", "parent")))
    return jsonError("Ikke innlogget", 401);
  const sesong = Number(request.nextUrl.searchParams.get("sesong"));
  if (!Number.isInteger(sesong)) return jsonError("Ugyldig sesong", 400);
  const a = (await getStore().arkiv(sesong)).at(-1);
  if (!a) return jsonError("Ingen arkiv for sesongen", 404);
  return NextResponse.json(lagMinner(a));
}

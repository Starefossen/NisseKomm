/**
 * POST /api/state/arkiv  Parent (guide cookie or parent Bearer, for
 * `mise run arkiver-sesong`): a manual snapshot of the shared state. Returns
 * { sesong, arkivert, nøkler, arkiv, minner }, or arkivert null when there is
 * nothing to keep.
 */
import { NextRequest, NextResponse } from "next/server";
import { checkOrigin, hasRole, jsonError } from "@/lib/auth";
import { getStore, storageBackend } from "@/lib/db";
import { authenticate } from "@/lib/mcp/auth";
import { lagMinner } from "@/lib/minner";
import { SEASON } from "@/lib/storage-adapter";

export async function POST(request: NextRequest) {
  if (request.headers.get("authorization")) {
    if ((await authenticate(request))?.level !== "parent")
      return jsonError("Bare for foreldre", 403);
  } else {
    if (!(await hasRole(request, "parent")))
      return jsonError("Bare for foreldre", 403);
    const nei = checkOrigin(request);
    if (nei) return nei;
  }
  if (storageBackend() !== "server")
    return jsonError("Ingen servertilstand å arkivere", 409);
  const a = await getStore().arkiver(SEASON, "manuell");
  console.log(`Sesong ${SEASON}: manuell arkivering ${a?.arkivert ?? "(tom)"}`);
  return NextResponse.json({
    sesong: SEASON,
    arkivert: a?.arkivert ?? null,
    nøkler: a ? Object.keys(a.data).length : 0,
    arkiv: a,
    minner: a ? lagMinner(a) : null,
  });
}

import { NextRequest } from "next/server";
import { hasRole, jsonError } from "@/lib/auth";
import { extraMusic } from "@/lib/media-server";

/** Uploaded NisseMusikk tracks beyond the built-in playlist (kid-visible). */
export async function GET(request: NextRequest) {
  if (!(await hasRole(request, "kid", "parent")))
    return jsonError("Ikke innlogget", 401);
  return Response.json((await extraMusic()).map((f) => f.path));
}

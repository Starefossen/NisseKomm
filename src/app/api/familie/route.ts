/** GET /api/familie  The family's names for a logged-in kid or parent. */
import { NextRequest, NextResponse } from "next/server";
import { hasRole, jsonError } from "@/lib/auth";
import { FAMILIE } from "@/lib/familie";

export async function GET(request: NextRequest) {
  if (!(await hasRole(request, "kid", "parent")))
    return jsonError("Ikke innlogget", 401);
  return NextResponse.json(FAMILIE, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

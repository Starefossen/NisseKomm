/** GET /api/familie  The family's names for a logged-in kid or parent, else null. */
import { NextRequest, NextResponse } from "next/server";
import { hasRole } from "@/lib/auth";
import { FAMILIE } from "@/lib/familie";

export async function GET(request: NextRequest) {
  // null, not 401: the login screen asks too, and a 401 is console noise.
  const ok = await hasRole(request, "kid", "parent");
  return NextResponse.json(ok ? FAMILIE : null, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

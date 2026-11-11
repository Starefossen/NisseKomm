/** POST /api/auth/verify  Returns { role } for the session cookies, or null. */
import { NextRequest, NextResponse } from "next/server";
import { hasRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const role = (await hasRole(request, "parent"))
    ? "parent"
    : (await hasRole(request, "kid"))
      ? "kid"
      : null;
  return NextResponse.json({ role });
}

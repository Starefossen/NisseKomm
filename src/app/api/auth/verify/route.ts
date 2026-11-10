/** POST /api/auth/verify  Returns { role } for the session cookie, or null. */
import { NextRequest, NextResponse } from "next/server";
import { getRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  return NextResponse.json({ role: await getRole(request) });
}

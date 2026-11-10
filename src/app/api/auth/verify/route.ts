/**
 * POST /api/auth/verify
 * Returns: { isParent: boolean } from the cookies set by /api/auth/login.
 *
 * ponytail: unsigned cookies; T4 replaces this with a signed cookie check.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, PARENT_COOKIE } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const parent = request.cookies.get(PARENT_COOKIE)?.value;
  return NextResponse.json({ isParent: !!session && session === parent });
}

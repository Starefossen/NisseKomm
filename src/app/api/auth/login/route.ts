/**
 * POST /api/auth/login
 * Body: { code: string }
 * Returns: { sessionId: string, role: 'kid' | 'parent' }
 *
 * ponytail: accepts any code of the right shape and uses it as sessionId.
 * T4 checks against KID_CODE/PARENT_CODE and signs the cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, PARENT_COOKIE } from "@/lib/auth-cookies";

const COOKIE_OPTIONS = {
  maxAge: 365 * 24 * 60 * 60,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: false, // client reads it to restore the session
};

function codeType(code: string): "kid" | "parent" | null {
  if (/^NORDPOL-[A-Z0-9]{5,}$/.test(code)) return "parent";
  if (/^[A-ZÆØÅ]+\d{4}\d*$/.test(code)) return "kid";
  return null;
}

export async function POST(request: NextRequest) {
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }
  if (typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();
  const role = codeType(code);
  if (!role) {
    return NextResponse.json({ error: "Ugyldig kode" }, { status: 401 });
  }

  const response = NextResponse.json({ sessionId: code, role });
  response.cookies.set(SESSION_COOKIE, code, COOKIE_OPTIONS);
  if (role === "parent") {
    response.cookies.set(PARENT_COOKIE, code, COOKIE_OPTIONS);
  }
  return response;
}
